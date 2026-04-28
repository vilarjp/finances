import { z } from "zod";

import type { ExpenseKind, RecordType } from "../../db/index.js";

export const homeReportQuerySchema = z
  .object({
    date: z.string(),
  })
  .strict();

export const monthlyReportQuerySchema = z
  .object({
    month: z.string(),
  })
  .strict();

export type HomeReportQuery = z.infer<typeof homeReportQuerySchema>;
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;

export type ReportCategorySummary = {
  id: string;
  name: string;
  fontColor: string;
  backgroundColor: string;
};

export type ReportRecurringValueTagSummary = {
  id: string;
  name: string;
  amountCents: number;
  lastAmountUpdatedAt: string;
};

export type ReportRecordValueResponse = {
  id: string;
  label: string;
  amountCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  recurringValueTagId?: string;
  category?: ReportCategorySummary;
  recurringValueTag?: ReportRecurringValueTagSummary;
};

export type ReportRecordResponse = {
  id: string;
  effectiveAt: string;
  financeDate: string;
  financeMonth: string;
  type: RecordType;
  expenseKind: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: ReportRecordValueResponse[];
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
};

export type FinanceRowResponse = {
  date: string;
  incomeRecords: ReportRecordResponse[];
  fixedExpenseRecords: ReportRecordResponse[];
  dailyExpenseRecords: ReportRecordResponse[];
  incomeTotalCents: number;
  fixedExpenseTotalCents: number;
  dailyExpenseTotalCents: number;
  balanceCents: number;
};

export type CategoryBreakdownItemResponse = {
  category: ReportCategorySummary | null;
  label: string;
  totalAmountCents: number;
};

export type DailyBalancePointResponse = {
  date: string;
  dayOfMonth: number;
  balanceCents: number;
};

export type HomeReportResponse = {
  date: string;
  currentMonth: string;
  previousMonth: string;
  currentDayRow: FinanceRowResponse;
  fiveDayRows: FinanceRowResponse[];
  currentMonthIncomeByCategory: CategoryBreakdownItemResponse[];
  currentMonthExpenseByCategory: CategoryBreakdownItemResponse[];
  dailyBalanceSeries: {
    currentMonth: DailyBalancePointResponse[];
    previousMonth: DailyBalancePointResponse[];
  };
};

export type MonthlyReportResponse = {
  month: string;
  rows: FinanceRowResponse[];
};
