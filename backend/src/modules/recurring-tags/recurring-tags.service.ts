import type { ObjectId } from "mongodb";

import type { DatabaseConnection } from "../../db/index.js";
import { HttpError, notFoundError } from "../../shared/errors.js";
import { createNoopLogger, type AppLogger } from "../../shared/logger.js";
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

  constructor(
    connection: DatabaseConnection,
    private readonly logger: AppLogger = createNoopLogger(),
  ) {
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

  async deleteRecurringTag(
    userId: ObjectId,
    tagId: ObjectId,
    now = new Date(),
    context: { requestId?: string } = {},
  ) {
    const result = await this.repository.deleteAndUnlinkValues({
      tagId,
      userId,
      now,
    });

    if (!result) {
      throw notFoundError("Recurring tag was not found.");
    }

    this.logger.audit("recurring_tag.values_unlinked", {
      affectedRecordCount: result.affectedRecordCount,
      affectedValueCount: result.affectedValueCount,
      requestId: context.requestId,
      recurringTagId: tagId.toHexString(),
      unlinkedAt: now.toISOString(),
      userId: userId.toHexString(),
    });
  }

  async updateRecurringTagAmount(
    userId: ObjectId,
    tagId: ObjectId,
    input: UpdateRecurringTagAmountInput,
    now = new Date(),
    context: { requestId?: string } = {},
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

    this.logger.audit("recurring_tag.amount_propagated", {
      affectedRecordCount: result.propagation.affectedRecordCount,
      affectedValueCount: result.propagation.affectedValueCount,
      cutoffAt: result.propagation.cutoffAt.toISOString(),
      recurringTagId: tagId.toHexString(),
      requestId: context.requestId,
      skippedPastValueCount: result.propagation.skippedPastValueCount,
      userId: userId.toHexString(),
    });

    return result;
  }
}
