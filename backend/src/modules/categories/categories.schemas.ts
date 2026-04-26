import { ObjectId } from "mongodb";
import { z } from "zod";

import type { CategoryDocument } from "../../db/index.js";
import { normalizeColorValue } from "../../shared/colors.js";
import { validationError } from "../../shared/errors.js";

const categoryNameSchema = z.string().trim().min(1).max(80);

function categoryColorSchema(field: string) {
  return z.unknown().transform((value) => normalizeColorValue(value, field));
}

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  fontColor: categoryColorSchema("fontColor"),
  backgroundColor: categoryColorSchema("backgroundColor"),
});

export const updateCategorySchema = z
  .object({
    name: categoryNameSchema.optional(),
    fontColor: categoryColorSchema("fontColor").optional(),
    backgroundColor: categoryColorSchema("backgroundColor").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one category field is required.",
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export type CategoryResponse = {
  id: string;
  name: string;
  fontColor: string;
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
};

export function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

export function parseCategoryId(value: string) {
  if (!ObjectId.isValid(value)) {
    throw validationError("Category id is invalid.", {
      field: "categoryId",
    });
  }

  const objectId = new ObjectId(value);

  if (objectId.toHexString() !== value.toLowerCase()) {
    throw validationError("Category id is invalid.", {
      field: "categoryId",
    });
  }

  return objectId;
}

export function toCategoryResponse(category: CategoryDocument): CategoryResponse {
  return {
    id: category._id.toHexString(),
    name: category.name,
    fontColor: category.fontColor,
    backgroundColor: category.backgroundColor,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
