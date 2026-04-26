import { render, screen, within } from "@testing-library/react";

import type { FinanceRow, ReportRecord } from "@entities/report";

import { FinanceTable } from "./finance-table";

function buildRecord(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    id: overrides.id ?? "record-income",
    effectiveAt: overrides.effectiveAt ?? "2026-04-26T12:00:00.000Z",
    financeDate: overrides.financeDate ?? "2026-04-26",
    financeMonth: overrides.financeMonth ?? "2026-04",
    type: overrides.type ?? "income",
    expenseKind: overrides.expenseKind ?? null,
    description: overrides.description ?? "Client payment",
    fontColor: overrides.fontColor ?? "#111827",
    backgroundColor: overrides.backgroundColor ?? "#DCFCE7",
    totalAmountCents: overrides.totalAmountCents ?? 200000,
    createdAt: overrides.createdAt ?? "2026-04-26T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-26T12:00:00.000Z",
    values: overrides.values ?? [
      {
        id: "value-consulting",
        label: "Consulting",
        amountCents: 200000,
        sortOrder: 0,
        categoryId: "category-services",
        recurringValueTagId: "tag-retainer",
        category: {
          id: "category-services",
          name: "Services",
          fontColor: "#111827",
          backgroundColor: "#DBEAFE",
        },
        recurringValueTag: {
          id: "tag-retainer",
          name: "Retainer",
          amountCents: 200000,
          lastAmountUpdatedAt: "2026-04-26T12:00:00.000Z",
        },
        createdAt: "2026-04-26T12:00:00.000Z",
        updatedAt: "2026-04-26T12:00:00.000Z",
      },
    ],
  };
}

function buildRow(overrides: Partial<FinanceRow> = {}): FinanceRow {
  return {
    date: overrides.date ?? "2026-04-26",
    incomeRecords: overrides.incomeRecords ?? [buildRecord()],
    fixedExpenseRecords: overrides.fixedExpenseRecords ?? [
      buildRecord({
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
            createdAt: "2026-04-26T12:00:00.000Z",
            updatedAt: "2026-04-26T12:00:00.000Z",
          },
        ],
      }),
    ],
    dailyExpenseRecords: overrides.dailyExpenseRecords ?? [
      buildRecord({
        id: "record-lunch",
        type: "expense",
        expenseKind: "daily",
        description: "Lunch",
        backgroundColor: "#DBEAFE",
        totalAmountCents: 35000,
        values: [
          {
            id: "value-lunch",
            label: "Meal",
            amountCents: 35000,
            sortOrder: 0,
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

it("renders the shared five-column table in the planned order with grouped records and nested values", () => {
  render(<FinanceTable rows={[buildRow()]} title="Daily finance rows" />);

  const table = screen.getByRole("table", { name: "Daily finance rows" });
  const headers = within(table)
    .getAllByRole("columnheader")
    .map((header) => header.textContent);

  expect(headers).toEqual(["Day", "Income", "Expenses", "Daily", "Balance"]);

  const incomeCell = within(table).getByRole("cell", {
    name: "Income records for 2026-04-26",
  });
  const expensesCell = within(table).getByRole("cell", {
    name: "Fixed expense records for 2026-04-26",
  });
  const dailyCell = within(table).getByRole("cell", {
    name: "Daily expense records for 2026-04-26",
  });
  const balanceCell = within(table).getByRole("cell", { name: "Balance for 2026-04-26" });

  expect(incomeCell).toHaveTextContent("Client payment");
  expect(incomeCell).toHaveTextContent("Consulting");
  expect(incomeCell).toHaveTextContent("Services");
  expect(incomeCell).toHaveTextContent("Retainer");
  expect(expensesCell).toHaveTextContent("Rent");
  expect(dailyCell).toHaveTextContent("Lunch");
  expect(balanceCell).toHaveTextContent("R$ 750,00");
});

it("supports multiple row datasets and preserves table structure for empty states", () => {
  const rows = [
    buildRow(),
    buildRow({
      balanceCents: -12500,
      dailyExpenseRecords: [],
      dailyExpenseTotalCents: 0,
      date: "2026-04-27",
      fixedExpenseRecords: [],
      fixedExpenseTotalCents: 0,
      incomeRecords: [],
      incomeTotalCents: 0,
    }),
  ];

  const { rerender } = render(<FinanceTable rows={rows} title="Monthly finance rows" />);

  expect(screen.getByRole("table", { name: "Monthly finance rows" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "Balance for 2026-04-27" })).toHaveTextContent(
    "-R$ 125,00",
  );
  expect(screen.getByRole("cell", { name: "Income records for 2026-04-27" })).toHaveTextContent(
    "No income records",
  );

  rerender(<FinanceTable emptyMessage="No monthly rows yet." rows={[]} title="Empty rows" />);

  const emptyTable = screen.getByRole("table", { name: "Empty rows" });

  expect(within(emptyTable).getAllByRole("columnheader")).toHaveLength(5);
  expect(within(emptyTable).getByText("No monthly rows yet.")).toBeInTheDocument();
});

it("renders compact drill-in rows for constrained layouts", () => {
  render(<FinanceTable rows={[buildRow()]} title="Three day finance rows" />);

  const compactRow = screen.getByRole("group", { name: "Compact finance row for 2026-04-26" });

  expect(within(compactRow).getByRole("heading", { name: "Income" })).toBeInTheDocument();
  expect(within(compactRow).getByRole("heading", { name: "Expenses" })).toBeInTheDocument();
  expect(within(compactRow).getByRole("heading", { name: "Daily" })).toBeInTheDocument();
  expect(
    within(compactRow).getByRole("button", { name: "Show values for Client payment" }),
  ).toBeInTheDocument();
});
