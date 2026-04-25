import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";

import { collectionNames, ensureDatabaseIndexes } from "./index.js";
import { createTestDatabase, type TestDatabase } from "../test/mongodb-memory.js";
import {
  insertCategoryFixture,
  insertRecordFixture,
  insertRecurringValueTagFixture,
  insertUserFixture,
} from "../test/repository-fixtures.js";

let testDatabase: TestDatabase | undefined;

afterEach(async () => {
  await testDatabase?.cleanup();
  testDatabase = undefined;
});

async function getIndexNames(collectionName: string) {
  if (!testDatabase) {
    throw new Error("Test database has not been created.");
  }

  const indexes = await testDatabase.db.collection(collectionName).indexes();

  return indexes.map((index) => index.name);
}

describe("ensureDatabaseIndexes", () => {
  it("creates the planned indexes for finance collections", async () => {
    testDatabase = await createTestDatabase();

    await ensureDatabaseIndexes(testDatabase.db);

    await expect(getIndexNames(collectionNames.users)).resolves.toEqual(
      expect.arrayContaining(["_id_", "users_normalized_email_unique"]),
    );
    await expect(getIndexNames(collectionNames.refreshTokens)).resolves.toEqual(
      expect.arrayContaining([
        "_id_",
        "refresh_tokens_user_id",
        "refresh_tokens_family_id",
        "refresh_tokens_token_hash_unique",
        "refresh_tokens_expires_at_ttl",
      ]),
    );
    await expect(getIndexNames(collectionNames.categories)).resolves.toEqual(
      expect.arrayContaining([
        "_id_",
        "categories_user_normalized_name_unique",
        "categories_user_id",
      ]),
    );
    await expect(getIndexNames(collectionNames.recurringValueTags)).resolves.toEqual(
      expect.arrayContaining([
        "_id_",
        "recurring_tags_user_normalized_name_unique",
        "recurring_tags_user_id",
      ]),
    );
    await expect(getIndexNames(collectionNames.records)).resolves.toEqual(
      expect.arrayContaining([
        "_id_",
        "records_user_finance_date",
        "records_user_finance_month",
        "records_user_effective_at",
        "records_user_value_category",
        "records_user_value_recurring_tag",
      ]),
    );

    const refreshTokenIndexes = await testDatabase.db
      .collection(collectionNames.refreshTokens)
      .indexes();

    expect(refreshTokenIndexes).toContainEqual(
      expect.objectContaining({
        name: "refresh_tokens_expires_at_ttl",
        expireAfterSeconds: 0,
      }),
    );
  });

  it("supports typed repository fixtures for finance collections", async () => {
    testDatabase = await createTestDatabase();

    const user = await insertUserFixture(testDatabase.db);
    const category = await insertCategoryFixture(testDatabase.db, {
      userId: user._id,
    });
    const recurringTag = await insertRecurringValueTagFixture(testDatabase.db, {
      userId: user._id,
    });
    const record = await insertRecordFixture(testDatabase.db, {
      userId: user._id,
      values: [
        {
          _id: new ObjectId(),
          label: "Salary",
          amountCents: 500_00,
          categoryId: category._id,
          recurringValueTagId: recurringTag._id,
          sortOrder: 0,
          createdAt: new Date("2026-04-25T03:00:00.000Z"),
          updatedAt: new Date("2026-04-25T03:00:00.000Z"),
        },
      ],
    });

    await expect(
      testDatabase.collections.records.findOne({ _id: record._id }),
    ).resolves.toMatchObject({
      userId: user._id,
      values: [
        expect.objectContaining({
          categoryId: category._id,
          recurringValueTagId: recurringTag._id,
        }),
      ],
    });
  });
});
