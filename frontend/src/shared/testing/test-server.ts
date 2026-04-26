import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import type { FinanceRow, HomeReport } from "@entities/report";

function buildEmptyFinanceRow(date: string): FinanceRow {
  return {
    date,
    incomeRecords: [],
    fixedExpenseRecords: [],
    dailyExpenseRecords: [],
    incomeTotalCents: 0,
    fixedExpenseTotalCents: 0,
    dailyExpenseTotalCents: 0,
    balanceCents: 0,
  };
}

function buildDefaultHomeReport(): HomeReport {
  return {
    date: "2026-04-26",
    currentMonth: "2026-04",
    previousMonth: "2026-03",
    currentDayRow: buildEmptyFinanceRow("2026-04-26"),
    threeDayRows: [
      buildEmptyFinanceRow("2026-04-26"),
      buildEmptyFinanceRow("2026-04-27"),
      buildEmptyFinanceRow("2026-04-28"),
    ],
    currentMonthIncomeByCategory: [],
    currentMonthExpenseByCategory: [],
    dailyBalanceSeries: {
      currentMonth: [],
      previousMonth: [],
    },
  };
}

export const server = setupServer(
  http.get("*/api/auth/me", () =>
    HttpResponse.json({ message: "Unauthenticated" }, { status: 401 }),
  ),
  http.get("*/api/auth/csrf", () => HttpResponse.json({ csrfToken: "test-csrf-token" })),
  http.post("*/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
  http.get("*/api/categories", () => HttpResponse.json({ categories: [] })),
  http.get("*/api/recurring-tags", () => HttpResponse.json({ recurringTags: [] })),
  http.get("*/api/records", () => HttpResponse.json({ records: [] })),
  http.get("*/api/reports/home", () => HttpResponse.json(buildDefaultHomeReport())),
);
