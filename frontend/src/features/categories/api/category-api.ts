import type { Category } from "@entities/category";
import { apiDelete, apiPatch, apiPost } from "@shared/api/http-client";

import type { CategoryFormValues } from "../model/forms";

type CategoryResponse = {
  category: Category;
};

export async function createCategory(values: CategoryFormValues) {
  const response = await apiPost<CategoryResponse>("/categories", values);

  if (!response.ok) {
    throw new Error("Category creation did not return a category.");
  }

  return response.data.category;
}

export async function updateCategory(categoryId: string, values: CategoryFormValues) {
  const response = await apiPatch<CategoryResponse>(`/categories/${categoryId}`, values);

  if (!response.ok) {
    throw new Error("Category update did not return a category.");
  }

  return response.data.category;
}

export async function deleteCategory(categoryId: string) {
  await apiDelete<void>(`/categories/${categoryId}`, {
    expectJson: false,
  });
}
