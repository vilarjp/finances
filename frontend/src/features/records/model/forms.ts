import { z } from "zod";

import type { ExpenseKind, FinanceRecord, RecordSnapshot, RecordType } from "@entities/record";

export type RecordClassification = "income" | "fixed-expense" | "daily-expense";

export type RecordValueFormValues = {
  amountCents: number;
  categoryId: string;
  id?: string;
  label: string;
  recurringValueTagId: string;
};

export type RecordFormValues = {
  backgroundColor: string;
  classification: RecordClassification;
  description: string;
  effectiveDate: string;
  effectiveTime: string;
  fontColor: string;
  values: RecordValueFormValues[];
};

export type RecordPayloadValue = {
  label: string;
  amountCents: number;
  sortOrder: number;
  categoryId?: string;
  id?: string;
  recurringValueTagId?: string;
};

export type RecordMutationPayload = {
  effectiveDate: string;
  type: RecordType;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordPayloadValue[];
  effectiveTime?: string;
  expenseKind?: ExpenseKind | null;
};

const colorValueSchema = z.string().regex(/^#[\da-f]{6}$/iu, "Use a #RRGGBB color.");
const financeDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Use a YYYY-MM-DD date.");
const financeTimeSchema = z
  .string()
  .regex(/^$|^\d{2}:\d{2}$/u, "Use an HH:mm time or leave it blank.");

export const amountCentsSchema = z
  .number()
  .int("Use whole cents.")
  .min(1, "Enter an amount greater than zero.")
  .max(999_999_999, "Use 999999999 cents or fewer.");

export const recordValueFormSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Enter a value label.").max(120, "Use 120 characters or fewer."),
  amountCents: amountCentsSchema,
  categoryId: z.string(),
  recurringValueTagId: z.string(),
});

export const recordFormSchema = z.object({
  effectiveDate: financeDateSchema,
  effectiveTime: financeTimeSchema,
  classification: z.enum(["income", "fixed-expense", "daily-expense"]),
  description: z.string().trim().max(500, "Use 500 characters or fewer."),
  fontColor: colorValueSchema,
  backgroundColor: colorValueSchema,
  values: z.array(recordValueFormSchema).min(1, "Keep at least one value.").max(50),
});

export function createDefaultRecordValue(): RecordValueFormValues {
  return {
    amountCents: 0,
    categoryId: "",
    label: "",
    recurringValueTagId: "",
  };
}

export function createDefaultRecordFormValues(effectiveDate: string): RecordFormValues {
  return {
    backgroundColor: "#DCFCE7",
    classification: "daily-expense",
    description: "",
    effectiveDate,
    effectiveTime: "",
    fontColor: "#111827",
    values: [createDefaultRecordValue()],
  };
}

function classificationToType(classification: RecordClassification): {
  expenseKind?: ExpenseKind | null;
  type: RecordType;
} {
  if (classification === "income") {
    return {
      type: "income",
    };
  }

  if (classification === "fixed-expense") {
    return {
      expenseKind: "fixed",
      type: "expense",
    };
  }

  return {
    expenseKind: "daily",
    type: "expense",
  };
}

function recordToClassification(record: FinanceRecord): RecordClassification {
  if (record.type === "income") {
    return "income";
  }

  if (record.expenseKind === "fixed") {
    return "fixed-expense";
  }

  return "daily-expense";
}

function getFinanceTime(effectiveAt: string) {
  const date = new Date(effectiveAt);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/Fortaleza",
  });

  return formatter.format(date);
}

function optionalValue(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

export function recordToFormValues(record: FinanceRecord): RecordFormValues {
  return {
    backgroundColor: record.backgroundColor.startsWith("#") ? record.backgroundColor : "#DCFCE7",
    classification: recordToClassification(record),
    description: record.description,
    effectiveDate: record.financeDate,
    effectiveTime: getFinanceTime(record.effectiveAt),
    fontColor: record.fontColor.startsWith("#") ? record.fontColor : "#111827",
    values: record.values.map((value) => ({
      amountCents: value.amountCents,
      categoryId: value.categoryId ?? "",
      id: value.id,
      label: value.label,
      recurringValueTagId: value.recurringValueTagId ?? "",
    })),
  };
}

export function recordToSnapshot(record: FinanceRecord): RecordSnapshot {
  const classification = recordToClassification(record);
  const typeAndKind = classificationToType(classification);

  return {
    ...typeAndKind,
    description: record.description,
    fontColor: record.fontColor,
    backgroundColor: record.backgroundColor,
    values: record.values.map((value, index) => ({
      label: value.label,
      amountCents: value.amountCents,
      sortOrder: index,
      ...(value.categoryId ? { categoryId: value.categoryId } : {}),
      ...(value.recurringValueTagId ? { recurringValueTagId: value.recurringValueTagId } : {}),
    })),
  };
}

export function formValuesToMutationPayload(values: RecordFormValues): RecordMutationPayload {
  const typeAndKind = classificationToType(values.classification);
  const payload: RecordMutationPayload = {
    ...typeAndKind,
    effectiveDate: values.effectiveDate,
    description: values.description.trim(),
    fontColor: values.fontColor,
    backgroundColor: values.backgroundColor,
    values: values.values.map((value, index) => ({
      label: value.label.trim(),
      amountCents: value.amountCents,
      sortOrder: index,
      ...(value.id ? { id: value.id } : {}),
      ...(optionalValue(value.categoryId) ? { categoryId: value.categoryId } : {}),
      ...(optionalValue(value.recurringValueTagId)
        ? { recurringValueTagId: value.recurringValueTagId }
        : {}),
    })),
  };
  const effectiveTime = optionalValue(values.effectiveTime);

  if (effectiveTime) {
    payload.effectiveTime = effectiveTime;
  }

  return payload;
}
