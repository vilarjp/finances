import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@shared/testing/test-server";

import { CategoryManager } from "./category-manager";

type TestCategory = {
  id: string;
  name: string;
  fontColor: string;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
};

function renderCategoryManager() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryManager />
    </QueryClientProvider>,
  );
}

it("creates, selects, and edits categories from the reusable category workspace", async () => {
  const user = userEvent.setup();
  const categories: TestCategory[] = [
    {
      id: "category-groceries",
      name: "Groceries",
      fontColor: "#111827",
      backgroundColor: "#FEF3C7",
      createdAt: "2026-04-26T12:00:00.000Z",
      updatedAt: "2026-04-26T12:00:00.000Z",
    },
  ];

  server.use(
    http.get("*/api/categories", () => HttpResponse.json({ categories })),
    http.post("*/api/categories", async ({ request }) => {
      const body = (await request.json()) as Pick<
        TestCategory,
        "backgroundColor" | "fontColor" | "name"
      >;
      const category: TestCategory = {
        id: `category-${body.name.toLowerCase()}`,
        name: body.name,
        fontColor: body.fontColor,
        backgroundColor: body.backgroundColor,
        createdAt: "2026-04-26T12:01:00.000Z",
        updatedAt: "2026-04-26T12:01:00.000Z",
      };

      categories.push(category);

      return HttpResponse.json({ category }, { status: 201 });
    }),
    http.patch("*/api/categories/:categoryId", async ({ params, request }) => {
      const body = (await request.json()) as Partial<
        Pick<TestCategory, "backgroundColor" | "fontColor" | "name">
      >;
      const category = categories.find((item) => item.id === params.categoryId);

      if (!category) {
        return HttpResponse.json({ error: { message: "Not found." } }, { status: 404 });
      }

      Object.assign(category, body, {
        updatedAt: "2026-04-26T12:02:00.000Z",
      });

      return HttpResponse.json({ category });
    }),
  );

  renderCategoryManager();

  expect(await screen.findByRole("option", { name: "Groceries" })).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Category"), "category-groceries");

  expect(screen.getByLabelText("Category name")).toHaveValue("Groceries");

  await user.type(screen.getByLabelText("New category name"), "Utilities");
  await user.click(screen.getByRole("button", { name: "Create category" }));

  expect(await screen.findByRole("option", { name: "Utilities" })).toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText("Category"), "category-utilities");
  await user.clear(screen.getByLabelText("Category name"));
  await user.type(screen.getByLabelText("Category name"), "Bills");
  await user.click(screen.getByRole("button", { name: "Save category" }));

  expect(await screen.findByRole("option", { name: "Bills" })).toBeInTheDocument();

  await waitFor(() =>
    expect(screen.queryByRole("option", { name: "Utilities" })).not.toBeInTheDocument(),
  );
});
