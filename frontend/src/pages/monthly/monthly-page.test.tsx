import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { App } from "@app/app";
import type { FinanceRow, MonthlyReport, ReportRecord } from "@entities/report";
import { server } from "@shared/testing/test-server";

type RecordMutationPayload = {
  backgroundColor: string;
  description: string;
  effectiveDate: string;
  effectiveTime?: string;
  expenseKind?: "fixed" | "daily" | null;
  fontColor: string;
  type: "income" | "expense";
  values: Array<{
    amountCents: number;
    categoryId?: string;
    label: string;
    recurringValueTagId?: string;
    sortOrder: number;
  }>;
};

type PasteRecordPayload = {
  sourceRecordId?: string;
  sourceSnapshot: Omit<RecordMutationPayload, "effectiveDate" | "effectiveTime">;
  targetDate: string;
  targetTime?: string;
};

function buildReportRecord(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    id: overrides.id ?? "record-consulting",
    effectiveAt: overrides.effectiveAt ?? "2024-02-14T12:00:00.000Z",
    financeDate: overrides.financeDate ?? "2024-02-14",
    financeMonth: overrides.financeMonth ?? "2024-02",
    type: overrides.type ?? "income",
    expenseKind: overrides.expenseKind ?? null,
    description: overrides.description ?? "Consulting",
    fontColor: overrides.fontColor ?? "#111827",
    backgroundColor: overrides.backgroundColor ?? "#DCFCE7",
    totalAmountCents: overrides.totalAmountCents ?? 250000,
    createdAt: overrides.createdAt ?? "2024-02-14T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2024-02-14T12:00:00.000Z",
    values: overrides.values ?? [
      {
        id: "value-consulting",
        label: "Client work",
        amountCents: 250000,
        sortOrder: 0,
        categoryId: "category-income",
        category: {
          id: "category-income",
          name: "Income",
          fontColor: "#111827",
          backgroundColor: "#DCFCE7",
        },
        createdAt: "2024-02-14T12:00:00.000Z",
        updatedAt: "2024-02-14T12:00:00.000Z",
      },
    ],
  };
}

function buildFinanceRow(date: string, records: ReportRecord[] = []): FinanceRow {
  const incomeRecords = records.filter((record) => record.type === "income");
  const fixedExpenseRecords = records.filter(
    (record) => record.type === "expense" && record.expenseKind === "fixed",
  );
  const dailyExpenseRecords = records.filter(
    (record) => record.type === "expense" && record.expenseKind === "daily",
  );
  const incomeTotalCents = incomeRecords.reduce(
    (total, record) => total + record.totalAmountCents,
    0,
  );
  const fixedExpenseTotalCents = fixedExpenseRecords.reduce(
    (total, record) => total + record.totalAmountCents,
    0,
  );
  const dailyExpenseTotalCents = dailyExpenseRecords.reduce(
    (total, record) => total + record.totalAmountCents,
    0,
  );

  return {
    date,
    incomeRecords,
    fixedExpenseRecords,
    dailyExpenseRecords,
    incomeTotalCents,
    fixedExpenseTotalCents,
    dailyExpenseTotalCents,
    balanceCents: incomeTotalCents - fixedExpenseTotalCents - dailyExpenseTotalCents,
  };
}

function getMonthDates(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const monthIndex = Number.parseInt(monthText ?? "", 10) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_value, index) => {
    const day = String(index + 1).padStart(2, "0");

    return `${month}-${day}`;
  });
}

function buildMonthlyReport(month: string, records: ReportRecord[] = []): MonthlyReport {
  return {
    month,
    rows: getMonthDates(month).map((date) =>
      buildFinanceRow(
        date,
        records.filter((record) => record.financeDate === date),
      ),
    ),
  };
}

function recordFromPayload(id: string, payload: RecordMutationPayload): ReportRecord {
  return buildReportRecord({
    id,
    backgroundColor: payload.backgroundColor,
    description: payload.description,
    effectiveAt: `${payload.effectiveDate}T12:00:00.000Z`,
    expenseKind: payload.type === "income" ? null : (payload.expenseKind ?? "daily"),
    financeDate: payload.effectiveDate,
    financeMonth: payload.effectiveDate.slice(0, 7),
    fontColor: payload.fontColor,
    totalAmountCents: payload.values.reduce((total, value) => total + value.amountCents, 0),
    type: payload.type,
    values: payload.values.map((value, index) => ({
      id: `${id}-value-${index}`,
      amountCents: value.amountCents,
      categoryId: value.categoryId,
      createdAt: "2024-02-14T12:00:00.000Z",
      label: value.label,
      recurringValueTagId: value.recurringValueTagId,
      sortOrder: value.sortOrder,
      updatedAt: "2024-02-14T12:00:00.000Z",
    })),
  });
}

function mockSignedInMonthlyPage() {
  let records = [buildReportRecord()];
  let lastPastePayload: PasteRecordPayload | null = null;
  const requestedMonths: string[] = [];

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
    http.get("*/api/categories", () =>
      HttpResponse.json({
        categories: [
          {
            id: "category-income",
            name: "Income",
            fontColor: "#111827",
            backgroundColor: "#DCFCE7",
            createdAt: "2024-02-14T12:00:00.000Z",
            updatedAt: "2024-02-14T12:00:00.000Z",
          },
        ],
      }),
    ),
    http.get("*/api/recurring-tags", () => HttpResponse.json({ recurringTags: [] })),
    http.get("*/api/reports/month", ({ request }) => {
      const month = new URL(request.url).searchParams.get("month") ?? "2024-02";

      requestedMonths.push(month);

      return HttpResponse.json(buildMonthlyReport(month, records));
    }),
    http.patch("*/api/records/:recordId", async ({ params, request }) => {
      const payload = (await request.json()) as RecordMutationPayload;
      const record = recordFromPayload(String(params.recordId), payload);

      records = records.map((item) => (item.id === params.recordId ? record : item));

      return HttpResponse.json({ record });
    }),
    http.post("*/api/records/paste", async ({ request }) => {
      lastPastePayload = (await request.json()) as PasteRecordPayload;

      const record = recordFromPayload("record-pasted", {
        ...lastPastePayload.sourceSnapshot,
        effectiveDate: lastPastePayload.targetDate,
        ...(lastPastePayload.targetTime ? { effectiveTime: lastPastePayload.targetTime } : {}),
      });

      records = [...records, record];

      return HttpResponse.json({ record }, { status: 201 });
    }),
  );

  return {
    getLastPastePayload: () => lastPastePayload,
    getRequestedMonths: () => requestedMonths,
  };
}

beforeEach(() => {
  window.history.pushState({}, "", "/monthly?month=2024-02");
  window.sessionStorage.clear();
});

it("renders leap-year month boundaries and navigates between selected months", async () => {
  const user = userEvent.setup();
  const requests = mockSignedInMonthlyPage();

  render(<App />);

  expect(await screen.findByRole("heading", { name: "Monthly view" })).toBeInTheDocument();
  expect(screen.getByLabelText("Selected month")).toHaveValue("2024-02");

  const februaryTable = await screen.findByRole("table", {
    name: "Monthly rows for February 2024",
  });

  expect(within(februaryTable).getByText("2024-02-01")).toBeInTheDocument();
  expect(within(februaryTable).getByText("2024-02-29")).toBeInTheDocument();
  expect(within(februaryTable).queryByText("2024-03-01")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Next month" }));

  expect(await screen.findByRole("heading", { name: "March 2024" })).toBeInTheDocument();
  expect(screen.getByLabelText("Selected month")).toHaveValue("2024-03");

  const marchTable = await screen.findByRole("table", {
    name: "Monthly rows for March 2024",
  });

  expect(within(marchTable).getByText("2024-03-31")).toBeInTheDocument();
  await waitFor(() => expect(requests.getRequestedMonths()).toContain("2024-03"));
});

it("edits monthly records and pastes a copied record onto the selected day", async () => {
  const user = userEvent.setup();
  const requests = mockSignedInMonthlyPage();

  render(<App />);

  expect((await screen.findAllByText("Consulting")).length).toBeGreaterThan(0);

  await user.click(screen.getAllByRole("button", { name: "Edit Consulting record" })[0]!);
  await user.clear(screen.getByLabelText("Record description"));
  await user.type(screen.getByLabelText("Record description"), "Client consulting");
  await user.click(screen.getByRole("button", { name: "Save record" }));

  expect(await screen.findByText("Updated Client consulting.")).toBeInTheDocument();
  expect((await screen.findAllByText("Client consulting")).length).toBeGreaterThan(0);

  await user.click(screen.getAllByRole("button", { name: "Copy Client consulting record" })[0]!);
  await user.click(screen.getAllByRole("button", { name: "Select 2024-02-29" })[0]!);
  await user.click(screen.getByRole("button", { name: "Paste copied record" }));

  expect(await screen.findByText("Pasted Client consulting to 2024-02-29.")).toBeInTheDocument();
  await waitFor(() => expect(requests.getLastPastePayload()?.targetDate).toBe("2024-02-29"));
});
