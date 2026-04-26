import type { RecurringTag, RecurringTagPropagation } from "@entities/recurring-tag";
import { apiPatch, apiPost } from "@shared/api/http-client";

import type {
  CreateRecurringTagFormValues,
  RecurringTagFormValues,
  UpdateRecurringTagAmountFormValues,
} from "../model/forms";

type RecurringTagResponse = {
  recurringTag: RecurringTag;
};

type RecurringTagAmountResponse = {
  propagation: RecurringTagPropagation;
  recurringTag: RecurringTag;
};

export async function createRecurringTag(values: CreateRecurringTagFormValues) {
  const response = await apiPost<RecurringTagResponse>("/recurring-tags", values);

  if (!response.ok) {
    throw new Error("Recurring tag creation did not return a tag.");
  }

  return response.data.recurringTag;
}

export async function updateRecurringTag(tagId: string, values: RecurringTagFormValues) {
  const response = await apiPatch<RecurringTagResponse>(`/recurring-tags/${tagId}`, values);

  if (!response.ok) {
    throw new Error("Recurring tag update did not return a tag.");
  }

  return response.data.recurringTag;
}

export async function updateRecurringTagAmount(
  tagId: string,
  values: UpdateRecurringTagAmountFormValues,
) {
  const response = await apiPatch<RecurringTagAmountResponse>(
    `/recurring-tags/${tagId}/amount`,
    values,
  );

  if (!response.ok) {
    throw new Error("Recurring tag amount update did not return a tag.");
  }

  return response.data;
}
