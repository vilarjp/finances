import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const homeReport = {
  date: "2026-04-26",
  currentMonth: "2026-04",
  previousMonth: "2026-03",
  currentDayRow: {
    date: "2026-04-26",
    incomeRecords: [],
    fixedExpenseRecords: [],
    dailyExpenseRecords: [],
    incomeTotalCents: 200000,
    fixedExpenseTotalCents: 90000,
    dailyExpenseTotalCents: 35000,
    balanceCents: 75000,
  },
  fiveDayRows: [
    {
      date: "2026-04-26",
      incomeRecords: [],
      fixedExpenseRecords: [],
      dailyExpenseRecords: [],
      incomeTotalCents: 200000,
      fixedExpenseTotalCents: 90000,
      dailyExpenseTotalCents: 35000,
      balanceCents: 75000,
    },
    {
      date: "2026-04-27",
      incomeRecords: [],
      fixedExpenseRecords: [],
      dailyExpenseRecords: [],
      incomeTotalCents: 0,
      fixedExpenseTotalCents: 0,
      dailyExpenseTotalCents: 0,
      balanceCents: 0,
    },
    {
      date: "2026-04-28",
      incomeRecords: [],
      fixedExpenseRecords: [],
      dailyExpenseRecords: [],
      incomeTotalCents: 0,
      fixedExpenseTotalCents: 0,
      dailyExpenseTotalCents: 0,
      balanceCents: 0,
    },
    {
      date: "2026-04-29",
      incomeRecords: [],
      fixedExpenseRecords: [],
      dailyExpenseRecords: [],
      incomeTotalCents: 0,
      fixedExpenseTotalCents: 0,
      dailyExpenseTotalCents: 0,
      balanceCents: 0,
    },
    {
      date: "2026-04-30",
      incomeRecords: [],
      fixedExpenseRecords: [],
      dailyExpenseRecords: [],
      incomeTotalCents: 0,
      fixedExpenseTotalCents: 0,
      dailyExpenseTotalCents: 0,
      balanceCents: 0,
    },
  ],
  currentMonthIncomeByCategory: [
    {
      category: {
        id: "category-salary",
        name: "Salary",
        fontColor: "#111827",
        backgroundColor: "#DCFCE7",
      },
      label: "Salary",
      totalAmountCents: 200000,
    },
  ],
  currentMonthExpenseByCategory: [
    {
      category: {
        id: "category-rent",
        name: "Rent",
        fontColor: "#111827",
        backgroundColor: "#FEE2E2",
      },
      label: "Rent",
      totalAmountCents: 90000,
    },
    {
      category: {
        id: "category-food",
        name: "Food",
        fontColor: "#111827",
        backgroundColor: "#DBEAFE",
      },
      label: "Food",
      totalAmountCents: 35000,
    },
  ],
  dailyBalanceSeries: {
    currentMonth: [
      { date: "2026-04-01", dayOfMonth: 1, balanceCents: 10000 },
      { date: "2026-04-02", dayOfMonth: 2, balanceCents: -5000 },
    ],
    previousMonth: [
      { date: "2026-03-01", dayOfMonth: 1, balanceCents: 2500 },
      { date: "2026-03-02", dayOfMonth: 2, balanceCents: 7500 },
    ],
  },
};

const monthlyReport = {
  month: "2024-02",
  rows: [
    {
      date: "2024-02-14",
      incomeRecords: [
        {
          id: "record-consulting",
          effectiveAt: "2024-02-14T12:00:00.000Z",
          financeDate: "2024-02-14",
          financeMonth: "2024-02",
          type: "income",
          expenseKind: null,
          description: "Consulting",
          fontColor: "#111827",
          backgroundColor: "#DCFCE7",
          totalAmountCents: 250000,
          createdAt: "2024-02-14T12:00:00.000Z",
          updatedAt: "2024-02-14T12:00:00.000Z",
          values: [
            {
              id: "value-consulting",
              label: "Client work",
              amountCents: 250000,
              sortOrder: 0,
              createdAt: "2024-02-14T12:00:00.000Z",
              updatedAt: "2024-02-14T12:00:00.000Z",
            },
          ],
        },
      ],
      fixedExpenseRecords: [],
      dailyExpenseRecords: [],
      incomeTotalCents: 250000,
      fixedExpenseTotalCents: 0,
      dailyExpenseTotalCents: 0,
      balanceCents: 250000,
    },
  ],
};

async function mockSignedInHome(page: Page) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      },
    });
  });
  await page.route("**/api/auth/csrf", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { csrfToken: "test-csrf-token" },
    });
  });
  await page.route("**/api/reports/home**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: homeReport,
    });
  });
  await page.route("**/api/categories", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { categories: [] },
    });
  });
  await page.route("**/api/recurring-tags", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { recurringTags: [] },
    });
  });
  await page.route("**/api/records**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { records: [] },
    });
  });
}

async function mockSignedInMonthly(page: Page) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      },
    });
  });
  await page.route("**/api/auth/csrf", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { csrfToken: "test-csrf-token" },
    });
  });
  await page.route("**/api/categories", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { categories: [] },
    });
  });
  await page.route("**/api/recurring-tags", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { recurringTags: [] },
    });
  });
  await page.route("**/api/reports/month**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: monthlyReport,
    });
  });
}

async function expectMobileButtonTargets(page: Page) {
  const undersizedButtons = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .map((button) => {
        const rect = button.getBoundingClientRect();
        const label =
          button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "Unlabeled button";

        return {
          height: Math.round(rect.height),
          label,
          width: Math.round(rect.width),
        };
      })
      .filter((button) => button.height < 40 || button.width < 40),
  );

  expect(undersizedButtons).toEqual([]);
}

test("loads the frontend shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Primary").getByRole("link", { name: "Login" })).toBeVisible();
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
]) {
  test(`keeps auth screens usable on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const path of ["/login", "/sign-up"]) {
      await page.goto(path);

      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.locator("form")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(viewport.width);

      if (viewport.name === "mobile") {
        await expectMobileButtonTargets(page);
      }
    }
  });
}

test("renders signed-in home dashboard on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockSignedInHome(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Summary cards" })).toContainText("Today's income");
  await expect(page.getByRole("region", { name: "Charts" })).toContainText("Income by category");
  await expect(page.getByRole("table", { exact: true, name: "Today" })).toHaveCount(0);
  await expect(page.getByRole("table", { name: "Today + 4 days" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1280);
});

test("keeps signed-in home dashboard usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSignedInHome(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Summary cards" })).toHaveAttribute(
    "aria-roledescription",
    "carousel",
  );
  await expect(page.getByRole("region", { name: "Charts" })).toHaveAttribute(
    "aria-roledescription",
    "carousel",
  );
  await expect(page.getByRole("region", { name: "Today + 4 days" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
  await expectMobileButtonTargets(page);
});

test("renders signed-in monthly view on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockSignedInMonthly(page);
  await page.goto("/monthly?month=2024-02");

  await expect(page.getByRole("heading", { name: "Monthly view" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "February 2024" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Monthly rows for February 2024" })).toBeVisible();
  await expect(page.getByText("Consulting").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous month" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next month" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1280);
});

test("keeps signed-in monthly view usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSignedInMonthly(page);
  await page.goto("/monthly?month=2024-02");

  await expect(page.getByRole("heading", { name: "Monthly view" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Monthly rows for February 2024" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Compact finance row for 2024-02-29" }),
  ).toBeAttached();
  await expect(page.getByRole("region", { name: "Selected day actions" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
  await expectMobileButtonTargets(page);
});
