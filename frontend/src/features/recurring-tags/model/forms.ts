import { z } from "zod";

export const recurringTagNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a recurring tag name.")
  .max(80, "Use 80 characters or fewer.");

export const amountCentsSchema = z
  .number()
  .int("Use whole cents.")
  .min(1, "Enter an amount greater than zero.")
  .max(999_999_999, "Use 999999999 cents or fewer.");

export const recurringTagFormSchema = z.object({
  name: recurringTagNameSchema,
});

export const createRecurringTagFormSchema = z.object({
  amountCents: amountCentsSchema,
  name: recurringTagNameSchema,
});

export const updateRecurringTagAmountFormSchema = z.object({
  amountCents: amountCentsSchema,
});

export type RecurringTagFormValues = z.infer<typeof recurringTagFormSchema>;
export type CreateRecurringTagFormValues = z.infer<typeof createRecurringTagFormSchema>;
export type UpdateRecurringTagAmountFormValues = z.infer<typeof updateRecurringTagAmountFormSchema>;
