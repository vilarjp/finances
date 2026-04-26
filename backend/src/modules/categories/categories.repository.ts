import { MongoServerError, ObjectId } from "mongodb";

import type { CategoryDocument, DatabaseConnection } from "../../db/index.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schemas.js";

export type CreateCategoryDocumentInput = CreateCategoryInput & {
  normalizedName: string;
  userId: ObjectId;
  now: Date;
};

export type UpdateCategoryDocumentInput = UpdateCategoryInput & {
  categoryId: ObjectId;
  normalizedName?: string;
  userId: ObjectId;
  now: Date;
};

export function isDuplicateKeyError(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000;
}

export class CategoriesRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async listByUserId(userId: ObjectId) {
    return this.connection.collections.categories
      .find({
        userId,
      })
      .sort({
        normalizedName: 1,
        _id: 1,
      })
      .toArray();
  }

  async create(input: CreateCategoryDocumentInput) {
    const document: CategoryDocument = {
      _id: new ObjectId(),
      userId: input.userId,
      name: input.name.trim(),
      normalizedName: input.normalizedName,
      fontColor: input.fontColor,
      backgroundColor: input.backgroundColor,
      createdAt: input.now,
      updatedAt: input.now,
    };

    await this.connection.collections.categories.insertOne(document);

    return document;
  }

  async update(input: UpdateCategoryDocumentInput) {
    const $set: Partial<CategoryDocument> = {
      updatedAt: input.now,
    };

    if (input.name !== undefined) {
      $set.name = input.name.trim();
    }

    if (input.normalizedName !== undefined) {
      $set.normalizedName = input.normalizedName;
    }

    if (input.fontColor !== undefined) {
      $set.fontColor = input.fontColor;
    }

    if (input.backgroundColor !== undefined) {
      $set.backgroundColor = input.backgroundColor;
    }

    return this.connection.collections.categories.findOneAndUpdate(
      {
        _id: input.categoryId,
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

  async deleteAndUnlinkValues(input: { categoryId: ObjectId; userId: ObjectId; now: Date }) {
    const session = this.connection.client.startSession();
    let deletedCategory: CategoryDocument | null = null;

    try {
      await session.withTransaction(async () => {
        deletedCategory = await this.connection.collections.categories.findOneAndDelete(
          {
            _id: input.categoryId,
            userId: input.userId,
          },
          {
            session,
          },
        );

        if (!deletedCategory) {
          return;
        }

        await this.connection.collections.records.updateMany(
          {
            userId: input.userId,
            "values.categoryId": input.categoryId,
          },
          {
            $set: {
              updatedAt: input.now,
            },
            $unset: {
              "values.$[value].categoryId": "",
            },
          },
          {
            arrayFilters: [
              {
                "value.categoryId": input.categoryId,
              },
            ],
            session,
          },
        );
      });
    } finally {
      await session.endSession();
    }

    return deletedCategory;
  }
}
