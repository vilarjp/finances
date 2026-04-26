import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import { server } from "@shared/testing/test-server";

type TestCategory = {
  id: string;
  name: string;
  fontColor: string;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
};

beforeEach(() => {
  window.history.pushState({}, "", "/");
});

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
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    ),
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

  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();
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
