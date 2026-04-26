import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@shared/api/http-client";

import type { Category } from "../model/types";

type CategoriesResponse = {
  categories: Category[];
};

export const categoriesQueryKey = ["categories"] as const;

export async function fetchCategories() {
  const response = await apiGet<CategoriesResponse>("/categories");

  if (!response.ok) {
    throw new Error("Categories request did not return data.");
  }

  return response.data.categories;
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: fetchCategories,
  });
}
