import type { ObjectId } from "mongodb";

import type { DatabaseConnection } from "../../db/index.js";
import { HttpError, notFoundError } from "../../shared/errors.js";
import {
  isDuplicateKeyError,
  RecurringTagsRepository,
  type UpdateRecurringTagDocumentInput,
} from "./recurring-tags.repository.js";
import {
  type CreateRecurringTagInput,
  normalizeRecurringTagName,
  type UpdateRecurringTagAmountInput,
  type UpdateRecurringTagInput,
} from "./recurring-tags.schemas.js";

function duplicateRecurringTagNameError() {
  return new HttpError({
    code: "RECURRING_TAG_NAME_ALREADY_EXISTS",
    message: "Recurring tag name already exists.",
    statusCode: 409,
  });
}

export class RecurringTagsService {
  private readonly repository: RecurringTagsRepository;

  constructor(connection: DatabaseConnection) {
    this.repository = new RecurringTagsRepository(connection);
  }

  async listRecurringTags(userId: ObjectId) {
    return this.repository.listByUserId(userId);
  }

  async createRecurringTag(userId: ObjectId, input: CreateRecurringTagInput, now = new Date()) {
    try {
      return await this.repository.create({
        ...input,
        normalizedName: normalizeRecurringTagName(input.name),
        userId,
        now,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw duplicateRecurringTagNameError();
      }

      throw error;
    }
  }

  async updateRecurringTag(
    userId: ObjectId,
    tagId: ObjectId,
    input: UpdateRecurringTagInput,
    now = new Date(),
  ) {
    const updateInput: UpdateRecurringTagDocumentInput = {
      ...input,
      normalizedName: normalizeRecurringTagName(input.name),
      tagId,
      userId,
      now,
    };

    try {
      const recurringTag = await this.repository.update(updateInput);

      if (!recurringTag) {
        throw notFoundError("Recurring tag was not found.");
      }

      return recurringTag;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw duplicateRecurringTagNameError();
      }

      throw error;
    }
  }

  async deleteRecurringTag(userId: ObjectId, tagId: ObjectId, now = new Date()) {
    const deletedTag = await this.repository.deleteAndUnlinkValues({
      tagId,
      userId,
      now,
    });

    if (!deletedTag) {
      throw notFoundError("Recurring tag was not found.");
    }
  }

  async updateRecurringTagAmount(
    userId: ObjectId,
    tagId: ObjectId,
    input: UpdateRecurringTagAmountInput,
    now = new Date(),
  ) {
    const result = await this.repository.updateAmountAndPropagate({
      ...input,
      tagId,
      userId,
      now,
    });

    if (!result) {
      throw notFoundError("Recurring tag was not found.");
    }

    return result;
  }
}
