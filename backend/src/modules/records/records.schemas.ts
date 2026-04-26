import { ObjectId } from "mongodb";
import { z } from "zod";

import type { ExpenseKind, RecordDocument, RecordType } from "../../db/index.js";
import { normalizeColorValue } from "../../shared/colors.js";
import { validationError } from "../../shared/errors.js";
import { sumMoneyCents, assertAmountCents } from "../../shared/money.js";

const recordTypeSchema = z.enum(["income", "expense"]);
const expenseKindSchema = z.enum(["fixed", "daily"]);
const recordDescriptionSchema = z.string().trim().max(500);
const recordValueLabelSchema = z.string().trim().min(1).max(120);
const sortOrderSchema = z.number().int().min(0);

function recordColorSchema(field: string) {
  return z.unknown().transform((value) => normalizeColorValue(value, field));
}

function amountCentsSchema(field = "amountCents") {
  return z
    .number()
    .int()
    .transform((value) => assertAmountCents(value, field));
}

function objectIdSchema(field: string) {
  return z.string().transform((value) => parseObjectId(value, field));
}

function addTypeAndExpenseKindIssues(
  value: {
    type: RecordType;
    expenseKind?: ExpenseKind | null | undefined;
  },
  context: z.RefinementCtx,
) {
  if (value.type === "income" && value.expenseKind !== undefined && value.expenseKind !== null) {
    context.addIssue({
      code: "custom",
      message: "Income records must not include an expense kind.",
      path: ["expenseKind"],
    });
  }

  if (value.type === "expense" && value.expenseKind === undefined) {
    context.addIssue({
      code: "custom",
      message: "Expense records require an expense kind.",
      path: ["expenseKind"],
    });
  }
}

export const recordValueInputSchema = z
  .object({
    label: recordValueLabelSchema,
    amountCents: amountCentsSchema(),
    categoryId: objectIdSchema("categoryId").optional(),
    recurringValueTagId: objectIdSchema("recurringValueTagId").optional(),
    sortOrder: sortOrderSchema,
  })
  .strict();

const valuesInputSchema = z.array(recordValueInputSchema).min(1).max(50);

export const createRecordSchema = z
  .object({
    effectiveDate: z.string(),
    effectiveTime: z.string().optional(),
    type: recordTypeSchema,
    expenseKind: expenseKindSchema.nullable().optional(),
    description: recordDescriptionSchema,
    fontColor: recordColorSchema("fontColor"),
    backgroundColor: recordColorSchema("backgroundColor"),
    values: valuesInputSchema,
  })
  .strict()
  .superRefine(addTypeAndExpenseKindIssues);

export const updateRecordSchema = z
  .object({
    effectiveDate: z.string().optional(),
    effectiveTime: z.string().nullable().optional(),
    type: recordTypeSchema.optional(),
    expenseKind: expenseKindSchema.nullable().optional(),
    description: recordDescriptionSchema.optional(),
    fontColor: recordColorSchema("fontColor").optional(),
    backgroundColor: recordColorSchema("backgroundColor").optional(),
    values: valuesInputSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one record field is required.",
  });

export const recordRangeQuerySchema = z
  .object({
    from: z.string(),
    to: z.string(),
  })
  .strict();

export const recordSnapshotSchema = z
  .object({
    type: recordTypeSchema,
    expenseKind: expenseKindSchema.nullable().optional(),
    description: recordDescriptionSchema,
    fontColor: recordColorSchema("fontColor"),
    backgroundColor: recordColorSchema("backgroundColor"),
    values: valuesInputSchema,
  })
  .strict()
  .superRefine(addTypeAndExpenseKindIssues);

export const pasteRecordSchema = z
  .object({
    sourceRecordId: objectIdSchema("sourceRecordId").optional(),
    sourceSnapshot: recordSnapshotSchema,
    targetDate: z.string(),
    targetTime: z.string().optional(),
  })
  .strict();

export type RecordValueInput = z.infer<typeof recordValueInputSchema>;
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordRangeQuery = z.infer<typeof recordRangeQuerySchema>;
export type RecordSnapshotInput = z.infer<typeof recordSnapshotSchema>;
export type PasteRecordInput = z.infer<typeof pasteRecordSchema>;

export type RecordValueResponse = {
  id: string;
  label: string;
  amountCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  recurringValueTagId?: string;
};

export type RecordResponse = {
  id: string;
  effectiveAt: string;
  financeDate: string;
  financeMonth: string;
  type: RecordType;
  expenseKind: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordValueResponse[];
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
};

export function parseObjectId(value: string, field: string) {
  if (!ObjectId.isValid(value)) {
    throw validationError(`${field} is invalid.`, {
      field,
    });
  }

  const objectId = new ObjectId(value);

  if (objectId.toHexString() !== value.toLowerCase()) {
    throw validationError(`${field} is invalid.`, {
      field,
    });
  }

  return objectId;
}

export function parseRecordId(value: string) {
  return parseObjectId(value, "recordId");
}

export function toRecordResponse(record: RecordDocument): RecordResponse {
  const values = record.values
    .toSorted((left, right) => left.sortOrder - right.sortOrder)
    .map(
      (value): RecordValueResponse => ({
        id: value._id.toHexString(),
        label: value.label,
        amountCents: value.amountCents,
        sortOrder: value.sortOrder,
        createdAt: value.createdAt.toISOString(),
        updatedAt: value.updatedAt.toISOString(),
        ...(value.categoryId ? { categoryId: value.categoryId.toHexString() } : {}),
        ...(value.recurringValueTagId
          ? { recurringValueTagId: value.recurringValueTagId.toHexString() }
          : {}),
      }),
    );

  return {
    id: record._id.toHexString(),
    effectiveAt: record.effectiveAt.toISOString(),
    financeDate: record.financeDate,
    financeMonth: record.financeMonth,
    type: record.type,
    expenseKind: record.expenseKind,
    description: record.description,
    fontColor: record.fontColor,
    backgroundColor: record.backgroundColor,
    values,
    totalAmountCents: sumMoneyCents(values.map((value) => value.amountCents)),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
