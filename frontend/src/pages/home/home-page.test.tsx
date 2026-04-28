import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import type { FinanceRow, HomeReport, ReportRecord } from "@entities/report";
import { server } from "@shared/testing/test-server";

function buildReportRecord(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    id: overrides.id ?? "record-salary",
    effectiveAt: overrides.effectiveAt ?? "2026-04-26T12:00:00.000Z",
    financeDate: overrides.financeDate ?? "2026-04-26",
    financeMonth: overrides.financeMonth ?? "2026-04",
    type: overrides.type ?? "income",
    expenseKind: overrides.expenseKind ?? null,
    description: overrides.description ?? "Salary",
    fontColor: overrides.fontColor ?? "#111827",
    backgroundColor: overrides.backgroundColor ?? "#DCFCE7",
    totalAmountCents: overrides.totalAmountCents ?? 200000,
    createdAt: overrides.createdAt ?? "2026-04-26T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-26T12:00:00.000Z",
    values: overrides.values ?? [
      {
        id: "value-salary",
        label: "Main salary",
        amountCents: 200000,
        sortOrder: 0,
        categoryId: "category-salary",
        category: {
          id: "category-salary",
          name: "Salary",
          fontColor: "#111827",
          backgroundColor: "#DCFCE7",
        },
        createdAt: "2026-04-26T12:00:00.000Z",
        updatedAt: "2026-04-26T12:00:00.000Z",
      },
    ],
  };
}

function buildFinanceRow(overrides: Partial<FinanceRow> = {}): FinanceRow {
  return {
    date: overrides.date ?? "2026-04-26",
    incomeRecords: overrides.incomeRecords ?? [buildReportRecord()],
    fixedExpenseRecords: overrides.fixedExpenseRecords ?? [
      buildReportRecord({
        id: "record-rent",
        type: "expense",
        expenseKind: "fixed",
        description: "Rent",
        backgroundColor: "#FEE2E2",
        totalAmountCents: 90000,
        values: [
          {
            id: "value-rent",
            label: "Apartment",
            amountCents: 90000,
            sortOrder: 0,
            categoryId: "category-rent",
            category: {
              id: "category-rent",
              name: "Rent",
              fontColor: "#111827",
              backgroundColor: "#FEE2E2",
            },
            createdAt: "2026-04-26T12:00:00.000Z",
            updatedAt: "2026-04-26T12:00:00.000Z",
          },
        ],
      }),
    ],
    dailyExpenseRecords: overrides.dailyExpenseRecords ?? [
      buildReportRecord({
        id: "record-groceries",
        type: "expense",
        expenseKind: "daily",
        description: "Groceries",
        backgroundColor: "#DBEAFE",
        totalAmountCents: 35000,
        values: [
          {
            id: "value-groceries",
            label: "Market",
            amountCents: 35000,
            sortOrder: 0,
            categoryId: "category-food",
            category: {
              id: "category-food",
              name: "Food",
              fontColor: "#111827",
              backgroundColor: "#DBEAFE",
            },
            createdAt: "2026-04-26T12:00:00.000Z",
            updatedAt: "2026-04-26T12:00:00.000Z",
          },
        ],
      }),
    ],
    incomeTotalCents: overrides.incomeTotalCents ?? 200000,
    fixedExpenseTotalCents: overrides.fixedExpenseTotalCents ?? 90000,
    dailyExpenseTotalCents: overrides.dailyExpenseTotalCents ?? 35000,
    balanceCents: overrides.balanceCents ?? 75000,
  };
}

function buildHomeReport(): HomeReport {
  return {
    date: "2026-04-26",
    currentMonth: "2026-04",
    previousMonth: "2026-03",
    currentDayRow: buildFinanceRow(),
    fiveDayRows: [
      buildFinanceRow(),
      buildFinanceRow({
        date: "2026-04-27",
        incomeRecords: [],
        fixedExpenseRecords: [],
        dailyExpenseRecords: [],
        incomeTotalCents: 0,
        fixedExpenseTotalCents: 0,
        dailyExpenseTotalCents: 0,
        balanceCents: 0,
      }),
      buildFinanceRow({
        date: "2026-04-28",
        incomeRecords: [],
        fixedExpenseRecords: [],
        dailyExpenseRecords: [],
        incomeTotalCents: 0,
        fixedExpenseTotalCents: 0,
        dailyExpenseTotalCents: 0,
        balanceCents: 0,
      }),
      buildFinanceRow({
        date: "2026-04-29",
        incomeRecords: [],
        fixedExpenseRecords: [],
        dailyExpenseRecords: [],
        incomeTotalCents: 0,
        fixedExpenseTotalCents: 0,
        dailyExpenseTotalCents: 0,
        balanceCents: 0,
      }),
      buildFinanceRow({
        date: "2026-04-30",
        incomeRecords: [],
        fixedExpenseRecords: [],
        dailyExpenseRecords: [],
        incomeTotalCents: 0,
        fixedExpenseTotalCents: 0,
        dailyExpenseTotalCents: 0,
        balanceCents: 0,
      }),
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
}

beforeEach(() => {
  window.history.pushState({}, "", "/");
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
    http.get("*/api/reports/home", () => HttpResponse.json(buildHomeReport())),
  );
});

it("renders the report-driven home dashboard sections", async () => {
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Personal Finance" })).toBeInTheDocument();

  const summaryCarousel = await screen.findByRole("region", { name: "Summary cards" });
  const chartCarousel = await screen.findByRole("region", { name: "Charts" });
  const tableCarousel = await screen.findByRole("region", { name: "Finance tables" });

  expect(summaryCarousel).toHaveAttribute("aria-roledescription", "carousel");
  expect(within(summaryCarousel).getByText("Today's income")).toBeInTheDocument();
  expect(within(summaryCarousel).getByText("R$ 2.000,00")).toBeInTheDocument();
  expect(within(summaryCarousel).getByText("Today's expenses")).toBeInTheDocument();
  expect(within(summaryCarousel).getByText("R$ 1.250,00")).toBeInTheDocument();

  expect(within(chartCarousel).getByRole("heading", { name: "Category flow" })).toBeInTheDocument();
  expect(within(chartCarousel).getByRole("heading", { name: "Daily balance" })).toBeInTheDocument();
  expect(within(chartCarousel).getByText("Income by category")).toBeInTheDocument();
  expect(within(chartCarousel).getByText("Expenses by category")).toBeInTheDocument();
  expect(within(chartCarousel).getByText("Salary")).toBeInTheDocument();
  expect(within(chartCarousel).getByText("Rent")).toBeInTheDocument();
  const balanceLegend = within(chartCarousel).getByLabelText("Daily balance months");
  expect(
    within(balanceLegend)
      .getAllByText(/2026/u)
      .map((item) => item.textContent),
  ).toEqual(["March 2026", "April 2026"]);

  expect(within(tableCarousel).queryByRole("table", { name: "Today" })).not.toBeInTheDocument();
  expect(within(tableCarousel).getByRole("table", { name: "Today + 4 days" })).toBeInTheDocument();
  expect(within(tableCarousel).getByRole("region", { name: "Today + 4 days" })).toHaveClass(
    "w-full",
  );
  expect(within(tableCarousel).getAllByText("Salary").length).toBeGreaterThan(0);
  expect(within(tableCarousel).getAllByText("Groceries").length).toBeGreaterThan(0);

  const main = screen.getByRole("main");
  expect(within(main).queryByText("Finance records")).not.toBeInTheDocument();
  expect(within(main).queryByRole("heading", { name: "Records" })).not.toBeInTheDocument();
  expect(within(main).queryByRole("button", { name: "Create record" })).not.toBeInTheDocument();
});
