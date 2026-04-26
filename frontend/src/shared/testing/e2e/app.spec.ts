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
  threeDayRows: [
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
  await expect(page.getByRole("table", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Next 2 days" })).toBeVisible();
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
  await expect(page.getByRole("region", { name: "Finance tables" })).toHaveAttribute(
    "aria-roledescription",
    "carousel",
  );
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});
