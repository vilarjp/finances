import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useState, type PropsWithChildren } from "react";

import { server } from "@shared/testing/test-server";

import {
  RecurringTagValueEditor,
  type RecurringTagValueEditorValue,
} from "./recurring-tag-value-editor";

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

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

function TestQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function TestRecurringTagValueEditor() {
  const [value, setValue] = useState<RecurringTagValueEditorValue>({
    amountCents: 0,
    recurringValueTagId: "",
  });

  return <RecurringTagValueEditor onValueChange={setValue} value={value} />;
}

it("selects, creates, applies, edits, and unlinks recurring tags from the value editor", async () => {
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
        lastAmountUpdatedAt: "2026-04-26T12:03:00.000Z",
        createdAt: "2026-04-26T12:03:00.000Z",
        updatedAt: "2026-04-26T12:03:00.000Z",
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
      recurringTag.updatedAt = "2026-04-26T12:04:00.000Z";

      return HttpResponse.json({ recurringTag });
    }),
    http.patch("*/api/recurring-tags/:tagId/amount", async ({ params, request }) => {
      const body = (await request.json()) as Pick<TestRecurringTag, "amountCents">;
      const recurringTag = recurringTags.find((item) => item.id === params.tagId);

      if (!recurringTag) {
        return HttpResponse.json({ error: { message: "Not found." } }, { status: 404 });
      }

      recurringTag.amountCents = body.amountCents;
      recurringTag.lastAmountUpdatedAt = "2026-04-26T12:05:00.000Z";
      recurringTag.updatedAt = "2026-04-26T12:05:00.000Z";

      const propagation: PropagationResponse = {
        affectedRecordCount: 1,
        affectedValueCount: 2,
        cutoffAt: recurringTag.lastAmountUpdatedAt,
        skippedPastValueCount: 3,
      };

      return HttpResponse.json({ propagation, recurringTag });
    }),
  );

  render(
    <TestQueryProvider>
      <TestRecurringTagValueEditor />
    </TestQueryProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Recurring Tags" })).toBeInTheDocument();

  await user.clear(screen.getByLabelText("Value amount cents"));
  await user.type(screen.getByLabelText("Value amount cents"), "45000");
  await user.selectOptions(screen.getByLabelText("Recurring tag"), "tag-rent");
  await user.click(screen.getByRole("button", { name: "Apply stored amount" }));

  expect(screen.getByLabelText("Value amount cents")).toHaveValue(120000);

  await user.clear(screen.getByLabelText("Value amount cents"));
  await user.type(screen.getByLabelText("Value amount cents"), "135000");
  await user.click(screen.getByRole("button", { name: "Update shared tag amount" }));

  expect(await screen.findByText("Updated 2 values in 1 record.")).toBeInTheDocument();

  await user.clear(screen.getByLabelText("Selected tag name"));
  await user.type(screen.getByLabelText("Selected tag name"), "Mortgage");
  await user.click(screen.getByRole("button", { name: "Save recurring tag" }));

  expect(await screen.findByRole("option", { name: "Mortgage" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Unlink recurring tag" }));

  await waitFor(() => expect(screen.getByLabelText("Recurring tag")).toHaveValue(""));

  await user.clear(screen.getByLabelText("Value amount cents"));
  await user.type(screen.getByLabelText("Value amount cents"), "90000");
  await user.type(screen.getByLabelText("New recurring tag name"), "Gym");
  await user.click(screen.getByRole("button", { name: "Create recurring tag from value" }));

  expect(await screen.findByRole("option", { name: "Gym" })).toBeInTheDocument();
  expect(screen.getByLabelText("Recurring tag")).toHaveValue("tag-gym");
});
