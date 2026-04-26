export type RecordType = "income" | "expense";
export type ExpenseKind = "fixed" | "daily";

export type RecordValue = {
  id: string;
  label: string;
  amountCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  recurringValueTagId?: string;
};

export type FinanceRecord = {
  id: string;
  effectiveAt: string;
  financeDate: string;
  financeMonth: string;
  type: RecordType;
  expenseKind: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordValue[];
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
};

export type RecordValueSnapshot = {
  label: string;
  amountCents: number;
  sortOrder: number;
  categoryId?: string;
  recurringValueTagId?: string;
};

export type RecordSnapshot = {
  type: RecordType;
  expenseKind?: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordValueSnapshot[];
};
