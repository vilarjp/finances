import type { ObjectId } from "mongodb";

import type { DatabaseConnection, ExpenseKind, RecordType } from "../../db/index.js";
import { validationError, notFoundError } from "../../shared/errors.js";
import { createFinanceInstant, deriveFinanceDateParts } from "../../shared/finance-time.js";
import { RecordsRepository } from "./records.repository.js";
import type {
  CreateRecordInput,
  PasteRecordInput,
  RecordRangeQuery,
  RecordSnapshotInput,
  RecordValueInput,
  UpdateRecordInput,
} from "./records.schemas.js";

const maximumRecordRangeDays = 370;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

function normalizeExpenseKind(type: RecordType, expenseKind: ExpenseKind | null | undefined) {
  if (type === "income") {
    if (expenseKind !== undefined && expenseKind !== null) {
      throw validationError("Income records must not include an expense kind.", {
        field: "expenseKind",
      });
    }

    return null;
  }

  if (expenseKind !== "fixed" && expenseKind !== "daily") {
    throw validationError("Expense records require an expense kind.", {
      field: "expenseKind",
    });
  }

  return expenseKind;
}

function createRecordInstant(date: string, time?: string | null) {
  if (time === undefined || time === null) {
    return createFinanceInstant({
      date,
    });
  }

  return createFinanceInstant({
    date,
    time,
  });
}

function getUniqueObjectIds(
  values: readonly RecordValueInput[],
  selectId: (value: RecordValueInput) => ObjectId | undefined,
) {
  const idsByHex = new Map<string, ObjectId>();

  for (const value of values) {
    const id = selectId(value);

    if (id) {
      idsByHex.set(id.toHexString(), id);
    }
  }

  return [...idsByHex.values()];
}

function getMissingIds(ids: readonly ObjectId[], ownedIds: ReadonlySet<string>) {
  return ids.map((id) => id.toHexString()).filter((id) => !ownedIds.has(id));
}

function getRecordRangeLengthDays(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / millisecondsPerDay) + 1;
}

export class RecordsService {
  private readonly repository: RecordsRepository;

  constructor(connection: DatabaseConnection) {
    this.repository = new RecordsRepository(connection);
  }

  async listRecords(userId: ObjectId, query: RecordRangeQuery) {
    const fromAt = createFinanceInstant({
      date: query.from,
      time: "00:00",
    });
    const toAt = createFinanceInstant({
      date: query.to,
      time: "00:00",
    });

    if (fromAt.getTime() > toAt.getTime()) {
      throw validationError("Record range start date must be before or equal to end date.", {
        field: "from",
      });
    }

    if (getRecordRangeLengthDays(fromAt, toAt) > maximumRecordRangeDays) {
      throw validationError("Record range cannot exceed 370 days.", {
        field: "to",
        maximumRecordRangeDays,
      });
    }

    return this.repository.listByFinanceDateRange({
      userId,
      from: query.from,
      to: query.to,
    });
  }

  async getRecord(userId: ObjectId, recordId: ObjectId) {
    const record = await this.repository.findById({
      userId,
      recordId,
    });

    if (!record) {
      throw notFoundError("Record was not found.");
    }

    return record;
  }

  async createRecord(userId: ObjectId, input: CreateRecordInput, now = new Date()) {
    return this.createRecordFromSnapshot(
      userId,
      {
        type: input.type,
        expenseKind: input.expenseKind,
        description: input.description,
        fontColor: input.fontColor,
        backgroundColor: input.backgroundColor,
        values: input.values,
      },
      {
        date: input.effectiveDate,
        ...(input.effectiveTime !== undefined ? { time: input.effectiveTime } : {}),
        now,
      },
    );
  }

  async updateRecord(
    userId: ObjectId,
    recordId: ObjectId,
    input: UpdateRecordInput,
    now = new Date(),
  ) {
    const existingRecord = await this.getRecord(userId, recordId);
    const updatesEffectiveAt =
      Object.hasOwn(input, "effectiveDate") || Object.hasOwn(input, "effectiveTime");
    const effectiveAt = updatesEffectiveAt
      ? createRecordInstant(input.effectiveDate ?? existingRecord.financeDate, input.effectiveTime)
      : existingRecord.effectiveAt;
    const financeDateParts = updatesEffectiveAt
      ? deriveFinanceDateParts(effectiveAt)
      : {
          financeDate: existingRecord.financeDate,
          financeMonth: existingRecord.financeMonth,
        };
    const type = input.type ?? existingRecord.type;
    const expenseKind = normalizeExpenseKind(
      type,
      Object.hasOwn(input, "expenseKind") ? input.expenseKind : existingRecord.expenseKind,
    );

    if (input.values !== undefined) {
      await this.assertValueReferencesBelongToUser(userId, input.values);
    }

    const updatedRecord = await this.repository.update({
      recordId,
      userId,
      effectiveAt,
      financeDate: financeDateParts.financeDate,
      financeMonth: financeDateParts.financeMonth,
      type,
      expenseKind,
      description: input.description ?? existingRecord.description,
      fontColor: input.fontColor ?? existingRecord.fontColor,
      backgroundColor: input.backgroundColor ?? existingRecord.backgroundColor,
      ...(input.values !== undefined ? { values: input.values } : {}),
      now,
    });

    if (!updatedRecord) {
      throw notFoundError("Record was not found.");
    }

    return updatedRecord;
  }

  async deleteRecord(userId: ObjectId, recordId: ObjectId) {
    const deletedRecord = await this.repository.delete({
      userId,
      recordId,
    });

    if (!deletedRecord) {
      throw notFoundError("Record was not found.");
    }
  }

  async pasteRecord(userId: ObjectId, input: PasteRecordInput, now = new Date()) {
    return this.createRecordFromSnapshot(userId, input.sourceSnapshot, {
      date: input.targetDate,
      ...(input.targetTime !== undefined ? { time: input.targetTime } : {}),
      now,
    });
  }

  private async createRecordFromSnapshot(
    userId: ObjectId,
    snapshot: RecordSnapshotInput,
    effectiveInput: {
      date: string;
      time?: string | null;
      now: Date;
    },
  ) {
    const effectiveAt = createRecordInstant(effectiveInput.date, effectiveInput.time);
    const financeDateParts = deriveFinanceDateParts(effectiveAt);
    const expenseKind = normalizeExpenseKind(snapshot.type, snapshot.expenseKind);

    await this.assertValueReferencesBelongToUser(userId, snapshot.values);

    return this.repository.create({
      userId,
      effectiveAt,
      financeDate: financeDateParts.financeDate,
      financeMonth: financeDateParts.financeMonth,
      type: snapshot.type,
      expenseKind,
      description: snapshot.description,
      fontColor: snapshot.fontColor,
      backgroundColor: snapshot.backgroundColor,
      values: snapshot.values,
      now: effectiveInput.now,
    });
  }

  private async assertValueReferencesBelongToUser(
    userId: ObjectId,
    values: readonly RecordValueInput[],
  ) {
    const categoryIds = getUniqueObjectIds(values, (value) => value.categoryId);
    const recurringTagIds = getUniqueObjectIds(values, (value) => value.recurringValueTagId);
    const [ownedCategoryIds, ownedRecurringTagIds] = await Promise.all([
      this.repository.findOwnedCategoryIds(userId, categoryIds),
      this.repository.findOwnedRecurringTagIds(userId, recurringTagIds),
    ]);
    const missingCategoryIds = getMissingIds(categoryIds, ownedCategoryIds);
    const missingRecurringTagIds = getMissingIds(recurringTagIds, ownedRecurringTagIds);

    if (missingCategoryIds.length > 0 || missingRecurringTagIds.length > 0) {
      throw validationError("Record value references must belong to the authenticated user.", {
        missingCategoryIds,
        missingRecurringTagIds,
      });
    }
  }
}
