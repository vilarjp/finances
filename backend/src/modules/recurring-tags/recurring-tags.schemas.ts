import { ObjectId } from "mongodb";
import { z } from "zod";

import type { RecurringValueTagDocument } from "../../db/index.js";
import { assertAmountCents } from "../../shared/money.js";
import { validationError } from "../../shared/errors.js";

const recurringTagNameSchema = z.string().trim().min(1).max(80);

const amountCentsSchema = z
  .number()
  .int()
  .transform((value) => assertAmountCents(value));

export const createRecurringTagSchema = z.object({
  name: recurringTagNameSchema,
  amountCents: amountCentsSchema,
});

export const updateRecurringTagSchema = z.object({
  name: recurringTagNameSchema,
});

export const updateRecurringTagAmountSchema = z.object({
  amountCents: amountCentsSchema,
});

export type CreateRecurringTagInput = z.infer<typeof createRecurringTagSchema>;
export type UpdateRecurringTagInput = z.infer<typeof updateRecurringTagSchema>;
export type UpdateRecurringTagAmountInput = z.infer<typeof updateRecurringTagAmountSchema>;

export type RecurringTagResponse = {
  id: string;
  name: string;
  amountCents: number;
  lastAmountUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export function normalizeRecurringTagName(name: string) {
  return name.trim().toLowerCase();
}

export function parseRecurringTagId(value: string) {
  if (!ObjectId.isValid(value)) {
    throw validationError("Recurring tag id is invalid.", {
      field: "tagId",
    });
  }

  const objectId = new ObjectId(value);

  if (objectId.toHexString() !== value.toLowerCase()) {
    throw validationError("Recurring tag id is invalid.", {
      field: "tagId",
    });
  }

  return objectId;
}

export function toRecurringTagResponse(
  recurringTag: RecurringValueTagDocument,
): RecurringTagResponse {
  return {
    id: recurringTag._id.toHexString(),
    name: recurringTag.name,
    amountCents: recurringTag.amountCents,
    lastAmountUpdatedAt: recurringTag.lastAmountUpdatedAt.toISOString(),
    createdAt: recurringTag.createdAt.toISOString(),
    updatedAt: recurringTag.updatedAt.toISOString(),
  };
}
