import { MongoServerError, ObjectId, type ClientSession } from "mongodb";

import type { DatabaseConnection, RecurringValueTagDocument } from "../../db/index.js";
import type {
  CreateRecurringTagInput,
  UpdateRecurringTagInput,
  UpdateRecurringTagAmountInput,
} from "./recurring-tags.schemas.js";

export type CreateRecurringTagDocumentInput = CreateRecurringTagInput & {
  normalizedName: string;
  userId: ObjectId;
  now: Date;
};

export type UpdateRecurringTagDocumentInput = UpdateRecurringTagInput & {
  normalizedName: string;
  tagId: ObjectId;
  userId: ObjectId;
  now: Date;
};

export type RecurringTagPropagationSummary = {
  cutoffAt: Date;
  affectedRecordCount: number;
  affectedValueCount: number;
  skippedPastValueCount: number;
};

export type RecurringTagAmountUpdateResult = {
  recurringTag: RecurringValueTagDocument;
  propagation: RecurringTagPropagationSummary;
};

type CountLinkedValuesInput = {
  tagId: ObjectId;
  userId: ObjectId;
  effectiveAt: {
    $gte?: Date;
    $lt?: Date;
  };
  session: ClientSession;
};

export function isDuplicateKeyError(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000;
}

export class RecurringTagsRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async listByUserId(userId: ObjectId) {
    return this.connection.collections.recurringValueTags
      .find({
        userId,
      })
      .sort({
        normalizedName: 1,
        _id: 1,
      })
      .toArray();
  }

  async create(input: CreateRecurringTagDocumentInput) {
    const document: RecurringValueTagDocument = {
      _id: new ObjectId(),
      userId: input.userId,
      name: input.name.trim(),
      normalizedName: input.normalizedName,
      amountCents: input.amountCents,
      lastAmountUpdatedAt: input.now,
      createdAt: input.now,
      updatedAt: input.now,
    };

    await this.connection.collections.recurringValueTags.insertOne(document);

    return document;
  }

  async update(input: UpdateRecurringTagDocumentInput) {
    return this.connection.collections.recurringValueTags.findOneAndUpdate(
      {
        _id: input.tagId,
        userId: input.userId,
      },
      {
        $set: {
          name: input.name.trim(),
          normalizedName: input.normalizedName,
          updatedAt: input.now,
        },
      },
      {
        returnDocument: "after",
      },
    );
  }

  async deleteAndUnlinkValues(input: { tagId: ObjectId; userId: ObjectId; now: Date }) {
    const session = this.connection.client.startSession();
    let deletedTag: RecurringValueTagDocument | null = null;

    try {
      await session.withTransaction(async () => {
        deletedTag = await this.connection.collections.recurringValueTags.findOneAndDelete(
          {
            _id: input.tagId,
            userId: input.userId,
          },
          {
            session,
          },
        );

        if (!deletedTag) {
          return;
        }

        await this.connection.collections.records.updateMany(
          {
            userId: input.userId,
            "values.recurringValueTagId": input.tagId,
          },
          {
            $set: {
              updatedAt: input.now,
            },
            $unset: {
              "values.$[value].recurringValueTagId": "",
            },
          },
          {
            arrayFilters: [
              {
                "value.recurringValueTagId": input.tagId,
              },
            ],
            session,
          },
        );
      });
    } finally {
      await session.endSession();
    }

    return deletedTag;
  }

  async updateAmountAndPropagate(
    input: UpdateRecurringTagAmountInput & {
      tagId: ObjectId;
      userId: ObjectId;
      now: Date;
    },
  ): Promise<RecurringTagAmountUpdateResult | null> {
    const session = this.connection.client.startSession();
    let updatedTag: RecurringValueTagDocument | null = null;
    let affectedRecordCount = 0;
    let affectedValueCount = 0;
    let skippedPastValueCount = 0;

    try {
      await session.withTransaction(async () => {
        updatedTag = await this.connection.collections.recurringValueTags.findOneAndUpdate(
          {
            _id: input.tagId,
            userId: input.userId,
          },
          {
            $set: {
              amountCents: input.amountCents,
              lastAmountUpdatedAt: input.now,
              updatedAt: input.now,
            },
          },
          {
            returnDocument: "after",
            session,
          },
        );

        if (!updatedTag) {
          return;
        }

        affectedRecordCount = await this.connection.collections.records.countDocuments(
          {
            userId: input.userId,
            effectiveAt: {
              $gte: input.now,
            },
            "values.recurringValueTagId": input.tagId,
          },
          {
            session,
          },
        );
        affectedValueCount = await this.countLinkedValues({
          tagId: input.tagId,
          userId: input.userId,
          effectiveAt: {
            $gte: input.now,
          },
          session,
        });
        skippedPastValueCount = await this.countLinkedValues({
          tagId: input.tagId,
          userId: input.userId,
          effectiveAt: {
            $lt: input.now,
          },
          session,
        });

        await this.connection.collections.records.updateMany(
          {
            userId: input.userId,
            effectiveAt: {
              $gte: input.now,
            },
            "values.recurringValueTagId": input.tagId,
          },
          {
            $set: {
              updatedAt: input.now,
              "values.$[value].amountCents": input.amountCents,
              "values.$[value].updatedAt": input.now,
            },
          },
          {
            arrayFilters: [
              {
                "value.recurringValueTagId": input.tagId,
              },
            ],
            session,
          },
        );
      });
    } finally {
      await session.endSession();
    }

    if (!updatedTag) {
      return null;
    }

    return {
      recurringTag: updatedTag,
      propagation: {
        cutoffAt: input.now,
        affectedRecordCount,
        affectedValueCount,
        skippedPastValueCount,
      },
    };
  }

  private async countLinkedValues(input: CountLinkedValuesInput) {
    const [result] = await this.connection.collections.records
      .aggregate<{ valueCount: number }>(
        [
          {
            $match: {
              userId: input.userId,
              effectiveAt: input.effectiveAt,
              "values.recurringValueTagId": input.tagId,
            },
          },
          {
            $unwind: "$values",
          },
          {
            $match: {
              "values.recurringValueTagId": input.tagId,
            },
          },
          {
            $count: "valueCount",
          },
        ],
        {
          session: input.session,
        },
      )
      .toArray();

    return result?.valueCount ?? 0;
  }
}
