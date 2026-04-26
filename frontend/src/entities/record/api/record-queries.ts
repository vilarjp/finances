import { useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { reportsQueryKey } from "@entities/report/api/report-queries";
import { apiGet } from "@shared/api/http-client";

import type { FinanceRecord } from "../model/types";

export type RecordsRange = {
  from: string;
  to: string;
};

type RecordsResponse = {
  records: FinanceRecord[];
};

export const recordsQueryKey = ["records"] as const;

export function recordsRangeQueryKey(range: RecordsRange) {
  return [...recordsQueryKey, range.from, range.to] as const;
}

export async function fetchRecords(range: RecordsRange) {
  const search = new URLSearchParams(range);
  const response = await apiGet<RecordsResponse>(`/records?${search.toString()}`);

  if (!response.ok) {
    throw new Error("Records request did not return data.");
  }

  return response.data.records;
}

export function useRecordsQuery(range: RecordsRange) {
  return useQuery({
    queryKey: recordsRangeQueryKey(range),
    queryFn: () => fetchRecords(range),
  });
}

export async function invalidateFinanceData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: recordsQueryKey }),
    queryClient.invalidateQueries({ queryKey: reportsQueryKey }),
  ]);
}
