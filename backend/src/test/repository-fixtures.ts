import { ObjectId, type Db } from "mongodb";

import {
  getFinanceCollections,
  type CategoryDocument,
  type RecordDocument,
  type RecordValueDocument,
  type RecurringValueTagDocument,
  type UserDocument,
} from "../db/index.js";

const defaultTimestamp = new Date("2026-04-25T12:00:00.000Z");

export async function insertUserFixture(
  db: Db,
  overrides: Partial<UserDocument> = {},
): Promise<UserDocument> {
  const _id = overrides._id ?? new ObjectId();
  const email = overrides.email ?? `user-${_id.toHexString()}@example.com`;
  const createdAt = overrides.createdAt ?? defaultTimestamp;
  const updatedAt = overrides.updatedAt ?? createdAt;
  const document: UserDocument = {
    _id,
    name: overrides.name ?? "Test User",
    email,
    normalizedEmail: overrides.normalizedEmail ?? email.trim().toLowerCase(),
    passwordHash: overrides.passwordHash ?? "$argon2id$fixture-password-hash",
    createdAt,
    updatedAt,
  };

  await getFinanceCollections(db).users.insertOne(document);

  return document;
}

export async function insertCategoryFixture(
  db: Db,
  overrides: Partial<CategoryDocument> = {},
): Promise<CategoryDocument> {
  const _id = overrides._id ?? new ObjectId();
  const name = overrides.name ?? `Category ${_id.toHexString().slice(-6)}`;
  const createdAt = overrides.createdAt ?? defaultTimestamp;
  const updatedAt = overrides.updatedAt ?? createdAt;
  const document: CategoryDocument = {
    _id,
    userId: overrides.userId ?? new ObjectId(),
    name,
    normalizedName: overrides.normalizedName ?? name.trim().toLowerCase(),
    fontColor: overrides.fontColor ?? "#111827",
    backgroundColor: overrides.backgroundColor ?? "#E5E7EB",
    createdAt,
    updatedAt,
  };

  await getFinanceCollections(db).categories.insertOne(document);

  return document;
}

export async function insertRecurringValueTagFixture(
  db: Db,
  overrides: Partial<RecurringValueTagDocument> = {},
): Promise<RecurringValueTagDocument> {
  const _id = overrides._id ?? new ObjectId();
  const name = overrides.name ?? `Recurring ${_id.toHexString().slice(-6)}`;
  const createdAt = overrides.createdAt ?? defaultTimestamp;
  const updatedAt = overrides.updatedAt ?? createdAt;
  const document: RecurringValueTagDocument = {
    _id,
    userId: overrides.userId ?? new ObjectId(),
    name,
    normalizedName: overrides.normalizedName ?? name.trim().toLowerCase(),
    amountCents: overrides.amountCents ?? 100_00,
    lastAmountUpdatedAt: overrides.lastAmountUpdatedAt ?? createdAt,
    createdAt,
    updatedAt,
  };

  await getFinanceCollections(db).recurringValueTags.insertOne(document);

  return document;
}

export async function insertRecordFixture(
  db: Db,
  overrides: Partial<RecordDocument> = {},
): Promise<RecordDocument> {
  const _id = overrides._id ?? new ObjectId();
  const createdAt = overrides.createdAt ?? defaultTimestamp;
  const updatedAt = overrides.updatedAt ?? createdAt;
  const type = overrides.type ?? "income";
  const document: RecordDocument = {
    _id,
    userId: overrides.userId ?? new ObjectId(),
    effectiveAt: overrides.effectiveAt ?? defaultTimestamp,
    financeDate: overrides.financeDate ?? "2026-04-25",
    financeMonth: overrides.financeMonth ?? "2026-04",
    type,
    expenseKind: overrides.expenseKind ?? (type === "expense" ? "fixed" : null),
    description: overrides.description ?? "Fixture record",
    fontColor: overrides.fontColor ?? "#111827",
    backgroundColor: overrides.backgroundColor ?? "#F9FAFB",
    values: overrides.values ?? [createRecordValueFixture()],
    createdAt,
    updatedAt,
  };

  await getFinanceCollections(db).records.insertOne(document);

  return document;
}

export function createRecordValueFixture(
  overrides: Partial<RecordValueDocument> = {},
): RecordValueDocument {
  const _id = overrides._id ?? new ObjectId();
  const createdAt = overrides.createdAt ?? defaultTimestamp;
  const updatedAt = overrides.updatedAt ?? createdAt;

  return {
    _id,
    label: overrides.label ?? `Value ${_id.toHexString().slice(-6)}`,
    amountCents: overrides.amountCents ?? 100_00,
    sortOrder: overrides.sortOrder ?? 0,
    createdAt,
    updatedAt,
    ...(overrides.categoryId ? { categoryId: overrides.categoryId } : {}),
    ...(overrides.recurringValueTagId
      ? { recurringValueTagId: overrides.recurringValueTagId }
      : {}),
  };
}
