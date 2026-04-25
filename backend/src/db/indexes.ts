import type { Db } from "mongodb";

import { getFinanceCollections } from "./collections.js";

export async function ensureDatabaseIndexes(db: Db): Promise<void> {
  const collections = getFinanceCollections(db);

  await Promise.all([
    collections.users.createIndexes([
      {
        key: { normalizedEmail: 1 },
        name: "users_normalized_email_unique",
        unique: true,
      },
    ]),
    collections.refreshTokens.createIndexes([
      {
        key: { userId: 1 },
        name: "refresh_tokens_user_id",
      },
      {
        key: { familyId: 1 },
        name: "refresh_tokens_family_id",
      },
      {
        key: { tokenHash: 1 },
        name: "refresh_tokens_token_hash_unique",
        unique: true,
      },
      {
        key: { expiresAt: 1 },
        name: "refresh_tokens_expires_at_ttl",
        expireAfterSeconds: 0,
      },
    ]),
    collections.categories.createIndexes([
      {
        key: { userId: 1, normalizedName: 1 },
        name: "categories_user_normalized_name_unique",
        unique: true,
      },
      {
        key: { userId: 1 },
        name: "categories_user_id",
      },
    ]),
    collections.recurringValueTags.createIndexes([
      {
        key: { userId: 1, normalizedName: 1 },
        name: "recurring_tags_user_normalized_name_unique",
        unique: true,
      },
      {
        key: { userId: 1 },
        name: "recurring_tags_user_id",
      },
    ]),
    collections.records.createIndexes([
      {
        key: { userId: 1, financeDate: 1 },
        name: "records_user_finance_date",
      },
      {
        key: { userId: 1, financeMonth: 1 },
        name: "records_user_finance_month",
      },
      {
        key: { userId: 1, effectiveAt: 1 },
        name: "records_user_effective_at",
      },
      {
        key: { userId: 1, "values.categoryId": 1 },
        name: "records_user_value_category",
      },
      {
        key: { userId: 1, "values.recurringValueTagId": 1 },
        name: "records_user_value_recurring_tag",
      },
    ]),
  ]);
}
