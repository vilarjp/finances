import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@shared/api/http-client";

import type { RecurringTag } from "../model/types";

type RecurringTagsResponse = {
  recurringTags: RecurringTag[];
};

export const recurringTagsQueryKey = ["recurring-tags"] as const;

export async function fetchRecurringTags() {
  const response = await apiGet<RecurringTagsResponse>("/recurring-tags");

  if (!response.ok) {
    throw new Error("Recurring tags request did not return data.");
  }

  return response.data.recurringTags;
}

export function useRecurringTagsQuery() {
  return useQuery({
    queryKey: recurringTagsQueryKey,
    queryFn: fetchRecurringTags,
  });
}
