import type { ExpenseKind, FinanceRecord, RecordType } from "@entities/record";

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

export type ReportRecordValue = {
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

export type ReportRecord = Omit<FinanceRecord, "expenseKind" | "type" | "values"> & {
  expenseKind: ExpenseKind | null;
  type: RecordType;
  values: ReportRecordValue[];
};

export type FinanceRow = {
  date: string;
  incomeRecords: ReportRecord[];
  fixedExpenseRecords: ReportRecord[];
  dailyExpenseRecords: ReportRecord[];
  incomeTotalCents: number;
  fixedExpenseTotalCents: number;
  dailyExpenseTotalCents: number;
  balanceCents: number;
};

export type CategoryBreakdownItem = {
  category: ReportCategorySummary | null;
  label: string;
  totalAmountCents: number;
};

export type DailyBalancePoint = {
  date: string;
  dayOfMonth: number;
  balanceCents: number;
};

export type HomeReport = {
  date: string;
  currentMonth: string;
  previousMonth: string;
  currentDayRow: FinanceRow;
  fiveDayRows: FinanceRow[];
  currentMonthIncomeByCategory: CategoryBreakdownItem[];
  currentMonthExpenseByCategory: CategoryBreakdownItem[];
  dailyBalanceSeries: {
    currentMonth: DailyBalancePoint[];
    previousMonth: DailyBalancePoint[];
  };
};

export type MonthlyReport = {
  month: string;
  rows: FinanceRow[];
};
