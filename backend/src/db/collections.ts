import type { Collection, Db, ObjectId } from "mongodb";

export const collectionNames = {
  users: "users",
  refreshTokens: "refreshTokens",
  categories: "categories",
  recurringValueTags: "recurringValueTags",
  records: "records",
} as const;

export type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RefreshTokenDocument = {
  _id: ObjectId;
  userId: ObjectId;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: ObjectId;
  reuseDetectedAt?: Date;
  lastUsedAt?: Date;
  userAgentHash?: string;
  ipHash?: string;
};

export type CategoryDocument = {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  normalizedName: string;
  fontColor: string;
  backgroundColor: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RecurringValueTagDocument = {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  normalizedName: string;
  amountCents: number;
  lastAmountUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type RecordType = "income" | "expense";
export type ExpenseKind = "fixed" | "daily";

export type RecordValueDocument = {
  _id: ObjectId;
  label: string;
  amountCents: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: ObjectId;
  recurringValueTagId?: ObjectId;
};

export type RecordDocument = {
  _id: ObjectId;
  userId: ObjectId;
  effectiveAt: Date;
  financeDate: string;
  financeMonth: string;
  type: RecordType;
  expenseKind: ExpenseKind | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordValueDocument[];
  createdAt: Date;
  updatedAt: Date;
};

export type FinanceCollections = {
  users: Collection<UserDocument>;
  refreshTokens: Collection<RefreshTokenDocument>;
  categories: Collection<CategoryDocument>;
  recurringValueTags: Collection<RecurringValueTagDocument>;
  records: Collection<RecordDocument>;
};

export function getFinanceCollections(db: Db): FinanceCollections {
  return {
    users: db.collection<UserDocument>(collectionNames.users),
    refreshTokens: db.collection<RefreshTokenDocument>(collectionNames.refreshTokens),
    categories: db.collection<CategoryDocument>(collectionNames.categories),
    recurringValueTags: db.collection<RecurringValueTagDocument>(
      collectionNames.recurringValueTags,
    ),
    records: db.collection<RecordDocument>(collectionNames.records),
  };
}
