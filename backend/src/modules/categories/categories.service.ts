import type { ObjectId } from "mongodb";

import type { DatabaseConnection } from "../../db/index.js";
import { HttpError, notFoundError } from "../../shared/errors.js";
import {
  CategoriesRepository,
  isDuplicateKeyError,
  type UpdateCategoryDocumentInput,
} from "./categories.repository.js";
import {
  type CreateCategoryInput,
  normalizeCategoryName,
  type UpdateCategoryInput,
} from "./categories.schemas.js";

function duplicateCategoryNameError() {
  return new HttpError({
    code: "CATEGORY_NAME_ALREADY_EXISTS",
    message: "Category name already exists.",
    statusCode: 409,
  });
}

export class CategoriesService {
  private readonly repository: CategoriesRepository;

  constructor(connection: DatabaseConnection) {
    this.repository = new CategoriesRepository(connection);
  }

  async listCategories(userId: ObjectId) {
    return this.repository.listByUserId(userId);
  }

  async createCategory(userId: ObjectId, input: CreateCategoryInput, now = new Date()) {
    try {
      return await this.repository.create({
        ...input,
        normalizedName: normalizeCategoryName(input.name),
        userId,
        now,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw duplicateCategoryNameError();
      }

      throw error;
    }
  }

  async updateCategory(
    userId: ObjectId,
    categoryId: ObjectId,
    input: UpdateCategoryInput,
    now = new Date(),
  ) {
    const updateInput: UpdateCategoryDocumentInput = {
      ...input,
      categoryId,
      userId,
      now,
    };

    if (input.name !== undefined) {
      updateInput.normalizedName = normalizeCategoryName(input.name);
    }

    try {
      const category = await this.repository.update(updateInput);

      if (!category) {
        throw notFoundError("Category was not found.");
      }

      return category;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw duplicateCategoryNameError();
      }

      throw error;
    }
  }

  async deleteCategory(userId: ObjectId, categoryId: ObjectId, now = new Date()) {
    const deletedCategory = await this.repository.deleteAndUnlinkValues({
      categoryId,
      userId,
      now,
    });

    if (!deletedCategory) {
      throw notFoundError("Category was not found.");
    }
  }
}
