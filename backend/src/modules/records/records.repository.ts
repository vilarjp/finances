import { ObjectId } from "mongodb";

import type {
  DatabaseConnection,
  ExpenseKind,
  RecordDocument,
  RecordType,
  RecordValueDocument,
} from "../../db/index.js";
import type { RecordValueInput, UpdateRecordValueInput } from "./records.schemas.js";

export type CreateRecordDocumentInput = {
  userId: ObjectId;
  effectiveAt: Date;
  financeDate: string;
  financeMonth: string;
  type: RecordType;
  expenseKind: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordValueInput[];
  now: Date;
};

export type UpdateRecordDocumentInput = {
  recordId: ObjectId;
  userId: ObjectId;
  effectiveAt: Date;
  financeDate: string;
  financeMonth: string;
  type: RecordType;
  expenseKind: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  existingValues: RecordValueDocument[];
  values?: UpdateRecordValueInput[];
  now: Date;
};

function toRecordValueDocument(
  value: RecordValueInput,
  now: Date,
  existingValue?: RecordValueDocument,
): RecordValueDocument {
  return {
    _id: existingValue?._id ?? new ObjectId(),
    label: value.label.trim(),
    amountCents: value.amountCents,
    sortOrder: value.sortOrder,
    createdAt: existingValue?.createdAt ?? now,
    updatedAt: now,
    ...(value.categoryId ? { categoryId: value.categoryId } : {}),
    ...(value.recurringValueTagId ? { recurringValueTagId: value.recurringValueTagId } : {}),
  };
}

function toUpdatedRecordValueDocuments(
  values: readonly UpdateRecordValueInput[],
  existingValues: readonly RecordValueDocument[],
  now: Date,
) {
  const existingValuesById = new Map(
    existingValues.map((value) => [value._id.toHexString(), value] as const),
  );

  return values.map((value) =>
    toRecordValueDocument(
      value,
      now,
      value.id ? existingValuesById.get(value.id.toHexString()) : undefined,
    ),
  );
}

export class RecordsRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async listByFinanceDateRange(input: { userId: ObjectId; from: string; to: string }) {
    return this.connection.collections.records
      .find({
        userId: input.userId,
        financeDate: {
          $gte: input.from,
          $lte: input.to,
        },
      })
      .sort({
        effectiveAt: 1,
        _id: 1,
      })
      .toArray();
  }

  async findById(input: { userId: ObjectId; recordId: ObjectId }) {
    return this.connection.collections.records.findOne({
      _id: input.recordId,
      userId: input.userId,
    });
  }

  async create(input: CreateRecordDocumentInput) {
    const document: RecordDocument = {
      _id: new ObjectId(),
      userId: input.userId,
      effectiveAt: input.effectiveAt,
      financeDate: input.financeDate,
      financeMonth: input.financeMonth,
      type: input.type,
      expenseKind: input.expenseKind,
      description: input.description.trim(),
      fontColor: input.fontColor,
      backgroundColor: input.backgroundColor,
      values: input.values.map((value) => toRecordValueDocument(value, input.now)),
      createdAt: input.now,
      updatedAt: input.now,
    };

    await this.connection.collections.records.insertOne(document);

    return document;
  }

  async update(input: UpdateRecordDocumentInput) {
    const $set: Partial<RecordDocument> = {
      effectiveAt: input.effectiveAt,
      financeDate: input.financeDate,
      financeMonth: input.financeMonth,
      type: input.type,
      expenseKind: input.expenseKind,
      description: input.description.trim(),
      fontColor: input.fontColor,
      backgroundColor: input.backgroundColor,
      updatedAt: input.now,
    };

    if (input.values !== undefined) {
      $set.values = toUpdatedRecordValueDocuments(input.values, input.existingValues, input.now);
    }

    return this.connection.collections.records.findOneAndUpdate(
      {
        _id: input.recordId,
        userId: input.userId,
      },
      {
        $set,
      },
      {
        returnDocument: "after",
      },
    );
  }

  async delete(input: { userId: ObjectId; recordId: ObjectId }) {
    return this.connection.collections.records.findOneAndDelete({
      _id: input.recordId,
      userId: input.userId,
    });
  }

  async findOwnedCategoryIds(userId: ObjectId, categoryIds: readonly ObjectId[]) {
    if (categoryIds.length === 0) {
      return new Set<string>();
    }

    const categories = await this.connection.collections.categories
      .find(
        {
          _id: {
            $in: [...categoryIds],
          },
          userId,
        },
        {
          projection: {
            _id: 1,
          },
        },
      )
      .toArray();

    return new Set(categories.map((category) => category._id.toHexString()));
  }

  async findOwnedRecurringTagIds(userId: ObjectId, recurringTagIds: readonly ObjectId[]) {
    if (recurringTagIds.length === 0) {
      return new Set<string>();
    }

    const recurringTags = await this.connection.collections.recurringValueTags
      .find(
        {
          _id: {
            $in: [...recurringTagIds],
          },
          userId,
        },
        {
          projection: {
            _id: 1,
          },
        },
      )
      .toArray();

    return new Set(recurringTags.map((recurringTag) => recurringTag._id.toHexString()));
  }
}
