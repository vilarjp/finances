import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@shared/api/http-client";

import type { HomeReport } from "../model/types";

export const reportsQueryKey = ["reports"] as const;

export function homeReportQueryKey(date: string) {
  return [...reportsQueryKey, "home", date] as const;
}

export async function fetchHomeReport(date: string) {
  const search = new URLSearchParams({ date });
  const response = await apiGet<HomeReport>(`/reports/home?${search.toString()}`);

  if (!response.ok) {
    throw new Error("Home report request did not return data.");
  }

  return response.data;
}

export function useHomeReportQuery(date: string) {
  return useQuery({
    queryKey: homeReportQueryKey(date),
    queryFn: () => fetchHomeReport(date),
  });
}
