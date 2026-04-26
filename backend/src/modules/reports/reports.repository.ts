import { ObjectId } from "mongodb";

import type {
  CategoryDocument,
  DatabaseConnection,
  RecordDocument,
  RecurringValueTagDocument,
} from "../../db/index.js";

export class ReportsRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async listRecordsByFinanceDateRange(input: {
    userId: ObjectId;
    from: string;
    to: string;
  }): Promise<RecordDocument[]> {
    return this.connection.collections.records
      .find({
        userId: input.userId,
        financeDate: {
          $gte: input.from,
          $lte: input.to,
        },
      })
      .sort({
        financeDate: 1,
        effectiveAt: 1,
        _id: 1,
      })
      .toArray();
  }

  async listCategoriesByIds(input: {
    userId: ObjectId;
    categoryIds: readonly ObjectId[];
  }): Promise<CategoryDocument[]> {
    if (input.categoryIds.length === 0) {
      return [];
    }

    return this.connection.collections.categories
      .find({
        _id: {
          $in: [...input.categoryIds],
        },
        userId: input.userId,
      })
      .sort({
        normalizedName: 1,
        _id: 1,
      })
      .toArray();
  }

  async listRecurringTagsByIds(input: {
    userId: ObjectId;
    recurringTagIds: readonly ObjectId[];
  }): Promise<RecurringValueTagDocument[]> {
    if (input.recurringTagIds.length === 0) {
      return [];
    }

    return this.connection.collections.recurringValueTags
      .find({
        _id: {
          $in: [...input.recurringTagIds],
        },
        userId: input.userId,
      })
      .sort({
        normalizedName: 1,
        _id: 1,
      })
      .toArray();
  }
}
