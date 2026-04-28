import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@shared/testing/test-server";

import { RecurringTagManager } from "./recurring-tag-manager";

type TestRecurringTag = {
  id: string;
  name: string;
  amountCents: number;
  lastAmountUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

type PropagationResponse = {
  affectedRecordCount: number;
  affectedValueCount: number;
  cutoffAt: string;
  skippedPastValueCount: number;
};

function renderRecurringTagManager() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RecurringTagManager />
    </QueryClientProvider>,
  );
}

it("creates, edits, updates amounts, and deletes recurring tags from the dedicated manager", async () => {
  const user = userEvent.setup();
  const recurringTags: TestRecurringTag[] = [
    {
      id: "tag-rent",
      name: "Rent",
      amountCents: 120000,
      lastAmountUpdatedAt: "2026-04-26T12:00:00.000Z",
      createdAt: "2026-04-26T12:00:00.000Z",
      updatedAt: "2026-04-26T12:00:00.000Z",
    },
  ];

  server.use(
    http.get("*/api/recurring-tags", () => HttpResponse.json({ recurringTags })),
    http.post("*/api/recurring-tags", async ({ request }) => {
      const body = (await request.json()) as Pick<TestRecurringTag, "amountCents" | "name">;
      const recurringTag: TestRecurringTag = {
        id: `tag-${body.name.toLowerCase()}`,
        name: body.name,
        amountCents: body.amountCents,
        lastAmountUpdatedAt: "2026-04-26T12:01:00.000Z",
        createdAt: "2026-04-26T12:01:00.000Z",
        updatedAt: "2026-04-26T12:01:00.000Z",
      };

      recurringTags.push(recurringTag);

      return HttpResponse.json({ recurringTag }, { status: 201 });
    }),
    http.patch("*/api/recurring-tags/:tagId", async ({ params, request }) => {
      const body = (await request.json()) as Pick<TestRecurringTag, "name">;
      const recurringTag = recurringTags.find((item) => item.id === params.tagId);

      if (!recurringTag) {
        return HttpResponse.json({ error: { message: "Not found." } }, { status: 404 });
      }

      recurringTag.name = body.name;
      recurringTag.updatedAt = "2026-04-26T12:02:00.000Z";

      return HttpResponse.json({ recurringTag });
    }),
    http.patch("*/api/recurring-tags/:tagId/amount", async ({ params, request }) => {
      const body = (await request.json()) as Pick<TestRecurringTag, "amountCents">;
      const recurringTag = recurringTags.find((item) => item.id === params.tagId);

      if (!recurringTag) {
        return HttpResponse.json({ error: { message: "Not found." } }, { status: 404 });
      }

      recurringTag.amountCents = body.amountCents;
      recurringTag.lastAmountUpdatedAt = "2026-04-26T12:03:00.000Z";
      recurringTag.updatedAt = "2026-04-26T12:03:00.000Z";

      const propagation: PropagationResponse = {
        affectedRecordCount: 1,
        affectedValueCount: 2,
        cutoffAt: recurringTag.lastAmountUpdatedAt,
        skippedPastValueCount: 3,
      };

      return HttpResponse.json({ propagation, recurringTag });
    }),
    http.delete("*/api/recurring-tags/:tagId", ({ params }) => {
      const index = recurringTags.findIndex((item) => item.id === params.tagId);

      if (index >= 0) {
        recurringTags.splice(index, 1);
      }

      return new HttpResponse(null, { status: 204 });
    }),
  );

  renderRecurringTagManager();

  expect(await screen.findByRole("option", { name: "Rent" })).toBeInTheDocument();

  await user.type(screen.getByLabelText("New recurring tag name"), "Gym");
  await user.type(screen.getByLabelText("New recurring tag amount cents"), "90000");
  await user.click(screen.getByRole("button", { name: "Create recurring tag" }));

  expect(await screen.findByRole("option", { name: "Gym" })).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Recurring tag"), "tag-gym");
  await user.clear(screen.getByLabelText("Recurring tag name"));
  await user.type(screen.getByLabelText("Recurring tag name"), "Fitness");
  await user.click(screen.getByRole("button", { name: "Save recurring tag" }));

  expect(await screen.findByRole("option", { name: "Fitness" })).toBeInTheDocument();

  await user.clear(screen.getByLabelText("Shared amount cents"));
  await user.type(screen.getByLabelText("Shared amount cents"), "95000");
  await user.click(screen.getByRole("button", { name: "Update shared amount" }));

  expect(await screen.findByText("Updated 2 values in 1 record.")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Delete recurring tag" }));

  await waitFor(() =>
    expect(screen.queryByRole("option", { name: "Fitness" })).not.toBeInTheDocument(),
  );
});
