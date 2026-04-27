import type { FastifyInstance } from "fastify";
import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import type { DatabaseConnection } from "../../db/index.js";
import {
  createRecordValueFixture,
  insertCategoryFixture,
  insertRecordFixture,
  insertRecurringValueTagFixture,
} from "../../test/repository-fixtures.js";
import { createTestDatabase, type TestDatabase } from "../../test/mongodb-memory.js";

const testCookieSecret = "test-cookie-secret-that-is-long-enough-for-records";

type ResponseWithHeaders = {
  headers: Record<string, string | string[] | number | undefined>;
};

let app: FastifyInstance | undefined;
let testDatabase: TestDatabase | undefined;

afterEach(async () => {
  await app?.close();
  await testDatabase?.cleanup();
  app = undefined;
  testDatabase = undefined;
});

function createDatabaseConnection(database: TestDatabase): DatabaseConnection {
  return {
    client: database.client,
    db: database.db,
    collections: database.collections,
    close: () => database.client.close(),
  };
}

async function createRecordsApp() {
  testDatabase = await createTestDatabase();
  app = await createApp({
    env: {
      NODE_ENV: "test",
      COOKIE_SECRET: testCookieSecret,
    },
    logger: false,
    database: {
      connection: createDatabaseConnection(testDatabase),
      closeOnAppClose: false,
    },
  });

  return {
    app,
    database: testDatabase,
  };
}

function getSetCookieHeaders(response: ResponseWithHeaders) {
  const setCookie = response.headers["set-cookie"];

  if (Array.isArray(setCookie)) {
    return setCookie;
  }

  return typeof setCookie === "string" ? [setCookie] : [];
}

function cookieHeaderFromResponse(response: ResponseWithHeaders) {
  return getSetCookieHeaders(response)
    .map((cookie) => cookie.split(";")[0])
    .filter((cookiePair): cookiePair is string => Boolean(cookiePair))
    .join("; ");
}

async function signUp(appInstance: FastifyInstance, email: string) {
  const response = await appInstance.inject({
    method: "POST",
    url: "/api/auth/signup",
    payload: {
      name: "Records User",
      email,
      password: "correct horse battery staple",
    },
  });
  const cookieHeader = cookieHeaderFromResponse(response);
  const csrfResponse = await appInstance.inject({
    method: "GET",
    url: "/api/auth/csrf",
    headers: {
      cookie: cookieHeader,
    },
  });

  return {
    cookieHeader,
    csrfToken: csrfResponse.json<{ csrfToken: string }>().csrfToken,
    userId: response.json<{ user: { id: string } }>().user.id,
  };
}

describe("record routes", () => {
  it("creates and lists income, fixed expense, and daily expense records with derived finance fields", async () => {
    const { app: appInstance, database } = await createRecordsApp();
    const user = await signUp(appInstance, "records@example.com");
    const userId = new ObjectId(user.userId);
    const category = await insertCategoryFixture(database.db, {
      userId,
      name: "Salary",
      normalizedName: "salary",
    });
    const recurringTag = await insertRecurringValueTagFixture(database.db, {
      userId,
      name: "Paycheck",
      normalizedName: "paycheck",
      amountCents: 3_000_00,
    });

    const incomeResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records",
      headers: {
        cookie: user.cookieHeader,
        "x-csrf-token": user.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-25",
        effectiveTime: "08:30",
        type: "income",
        description: " Paycheck ",
        fontColor: "#111827",
        backgroundColor: "record-default-background",
        values: [
          {
            label: " Salary ",
            amountCents: 3_000_00,
            categoryId: category._id.toHexString(),
            recurringValueTagId: recurringTag._id.toHexString(),
            sortOrder: 0,
          },
          {
            label: "Bonus",
            amountCents: 500_00,
            sortOrder: 1,
          },
        ],
      },
    });
    const fixedExpenseResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records",
      headers: {
        cookie: user.cookieHeader,
        "x-csrf-token": user.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-25",
        type: "expense",
        expenseKind: "fixed",
        description: "Rent",
        fontColor: "record-default-foreground",
        backgroundColor: "#FEE2E2",
        values: [
          {
            label: "Apartment rent",
            amountCents: 1_500_00,
            sortOrder: 0,
          },
        ],
      },
    });
    const dailyExpenseResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records",
      headers: {
        cookie: user.cookieHeader,
        "x-csrf-token": user.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-26",
        effectiveTime: "18:45",
        type: "expense",
        expenseKind: "daily",
        description: "Dinner",
        fontColor: "#111827",
        backgroundColor: "#DBEAFE",
        values: [
          {
            label: "Meal",
            amountCents: 85_90,
            sortOrder: 0,
          },
        ],
      },
    });
    const listResponse = await appInstance.inject({
      method: "GET",
      url: "/api/records?from=2026-04-01&to=2026-04-30",
      headers: {
        cookie: user.cookieHeader,
      },
    });

    expect(incomeResponse.statusCode).toBe(201);
    expect(incomeResponse.json()).toMatchObject({
      record: {
        effectiveAt: "2026-04-25T11:30:00.000Z",
        financeDate: "2026-04-25",
        financeMonth: "2026-04",
        type: "income",
        expenseKind: null,
        description: "Paycheck",
        fontColor: "#111827",
        backgroundColor: "record-default-background",
        totalAmountCents: 3_500_00,
        values: [
          {
            label: "Salary",
            amountCents: 3_000_00,
            categoryId: category._id.toHexString(),
            recurringValueTagId: recurringTag._id.toHexString(),
            sortOrder: 0,
          },
          {
            label: "Bonus",
            amountCents: 500_00,
            sortOrder: 1,
          },
        ],
      },
    });
    expect(fixedExpenseResponse.statusCode).toBe(201);
    expect(fixedExpenseResponse.json()).toMatchObject({
      record: {
        effectiveAt: "2026-04-26T02:59:59.999Z",
        financeDate: "2026-04-25",
        type: "expense",
        expenseKind: "fixed",
        totalAmountCents: 1_500_00,
      },
    });
    expect(dailyExpenseResponse.statusCode).toBe(201);
    expect(dailyExpenseResponse.json()).toMatchObject({
      record: {
        financeDate: "2026-04-26",
        type: "expense",
        expenseKind: "daily",
        totalAmountCents: 85_90,
      },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json<{ records: unknown[] }>().records).toHaveLength(3);
  });

  it("rejects empty records, invalid type combinations, and cross-user references", async () => {
    const { app: appInstance, database } = await createRecordsApp();
    const firstUser = await signUp(appInstance, "invalid-records@example.com");
    const secondUser = await signUp(appInstance, "invalid-records-other@example.com");
    const otherUserId = new ObjectId(secondUser.userId);
    const otherCategory = await insertCategoryFixture(database.db, {
      userId: otherUserId,
      name: "Other",
      normalizedName: "other",
    });
    const otherRecurringTag = await insertRecurringValueTagFixture(database.db, {
      userId: otherUserId,
      name: "Other Recurring",
      normalizedName: "other recurring",
    });

    const emptyRecordResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-25",
        type: "income",
        description: "Empty",
        fontColor: "#111827",
        backgroundColor: "#F9FAFB",
        values: [],
      },
    });
    const invalidTypeResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-25",
        type: "income",
        expenseKind: "fixed",
        description: "Income with expense kind",
        fontColor: "#111827",
        backgroundColor: "#F9FAFB",
        values: [
          {
            label: "Salary",
            amountCents: 100_00,
            sortOrder: 0,
          },
        ],
      },
    });
    const crossUserReferenceResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-25",
        type: "expense",
        expenseKind: "daily",
        description: "Invalid references",
        fontColor: "#111827",
        backgroundColor: "#F9FAFB",
        values: [
          {
            label: "Snack",
            amountCents: 25_00,
            categoryId: otherCategory._id.toHexString(),
            recurringValueTagId: otherRecurringTag._id.toHexString(),
            sortOrder: 0,
          },
        ],
      },
    });

    expect(emptyRecordResponse.statusCode).toBe(400);
    expect(invalidTypeResponse.statusCode).toBe(400);
    expect(crossUserReferenceResponse.statusCode).toBe(400);
    expect(crossUserReferenceResponse.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("reads, updates, and deletes only the authenticated user's records", async () => {
    const { app: appInstance, database } = await createRecordsApp();
    const firstUser = await signUp(appInstance, "record-owner@example.com");
    const secondUser = await signUp(appInstance, "record-viewer@example.com");
    const originalValueId = new ObjectId();
    const originalValueCreatedAt = new Date("2026-04-24T12:00:00.000Z");
    const record = await insertRecordFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      type: "expense",
      expenseKind: "fixed",
      description: "Original",
      values: [
        createRecordValueFixture({
          _id: originalValueId,
          createdAt: originalValueCreatedAt,
          label: "Original value",
          amountCents: 100_00,
          sortOrder: 0,
        }),
      ],
    });

    const getResponse = await appInstance.inject({
      method: "GET",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
      },
    });
    const updateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        description: "Updated",
        fontColor: "#F9FAFB",
        backgroundColor: "finance-expense",
        values: [
          {
            id: originalValueId.toHexString(),
            label: "Edited value",
            amountCents: 125_00,
            sortOrder: 0,
          },
        ],
      },
    });
    const crossUserUpdateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: secondUser.cookieHeader,
        "x-csrf-token": secondUser.csrfToken,
      },
      payload: {
        description: "Not mine",
      },
    });
    const deleteResponse = await appInstance.inject({
      method: "DELETE",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
    });
    const getDeletedResponse = await appInstance.inject({
      method: "GET",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
      },
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      record: {
        id: record._id.toHexString(),
        description: "Original",
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      record: {
        description: "Updated",
        fontColor: "#F9FAFB",
        backgroundColor: "finance-expense",
        totalAmountCents: 125_00,
        values: [
          {
            id: originalValueId.toHexString(),
            createdAt: originalValueCreatedAt.toISOString(),
            label: "Edited value",
            amountCents: 125_00,
          },
        ],
      },
    });
    expect(crossUserUpdateResponse.statusCode).toBe(404);
    expect(deleteResponse.statusCode).toBe(204);
    expect(getDeletedResponse.statusCode).toBe(404);
  });

  it("preserves existing finance-local time when only a record effective date changes", async () => {
    const { app: appInstance, database } = await createRecordsApp();
    const user = await signUp(appInstance, "record-date-update@example.com");
    const record = await insertRecordFixture(database.db, {
      userId: new ObjectId(user.userId),
      effectiveAt: new Date("2026-04-25T11:30:15.123Z"),
      financeDate: "2026-04-25",
      financeMonth: "2026-04",
      type: "expense",
      expenseKind: "daily",
      description: "Timed record",
      values: [
        createRecordValueFixture({
          label: "Timed value",
          amountCents: 50_00,
          sortOrder: 0,
        }),
      ],
    });

    const updateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: user.cookieHeader,
        "x-csrf-token": user.csrfToken,
      },
      payload: {
        effectiveDate: "2026-04-26",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      record: {
        effectiveAt: "2026-04-26T11:30:15.123Z",
        financeDate: "2026-04-26",
        financeMonth: "2026-04",
      },
    });
  });

  it("treats id-less updated values as new even when their sort order collides", async () => {
    const { app: appInstance, database } = await createRecordsApp();
    const user = await signUp(appInstance, "record-value-collision@example.com");
    const originalValueId = new ObjectId();
    const originalValueCreatedAt = new Date("2026-04-24T12:00:00.000Z");
    const record = await insertRecordFixture(database.db, {
      userId: new ObjectId(user.userId),
      type: "expense",
      expenseKind: "daily",
      description: "Record with values",
      values: [
        createRecordValueFixture({
          _id: originalValueId,
          createdAt: originalValueCreatedAt,
          label: "Original value",
          amountCents: 100_00,
          sortOrder: 0,
        }),
      ],
    });

    const updateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/records/${record._id.toHexString()}`,
      headers: {
        cookie: user.cookieHeader,
        "x-csrf-token": user.csrfToken,
      },
      payload: {
        values: [
          {
            id: originalValueId.toHexString(),
            label: "Edited value",
            amountCents: 125_00,
            sortOrder: 0,
          },
          {
            label: "New colliding value",
            amountCents: 25_00,
            sortOrder: 0,
          },
        ],
      },
    });

    const values = updateResponse.json<{
      record: {
        values: Array<{
          id: string;
          createdAt: string;
          label: string;
        }>;
      };
    }>().record.values;

    expect(updateResponse.statusCode).toBe(200);
    expect(values).toHaveLength(2);
    expect(values[0]).toMatchObject({
      id: originalValueId.toHexString(),
      createdAt: originalValueCreatedAt.toISOString(),
      label: "Edited value",
    });
    expect(values[1]).toMatchObject({
      label: "New colliding value",
    });
    expect(values[1]?.id).not.toBe(originalValueId.toHexString());
    expect(values[1]?.createdAt).not.toBe(originalValueCreatedAt.toISOString());
    expect(new Set(values.map((value) => value.id)).size).toBe(2);
  });

  it("pastes a sanitized source snapshot onto a target date without changing copied data", async () => {
    const { app: appInstance, database } = await createRecordsApp();
    const firstUser = await signUp(appInstance, "paste-owner@example.com");
    const secondUser = await signUp(appInstance, "paste-other@example.com");
    const firstUserId = new ObjectId(firstUser.userId);
    const secondUserId = new ObjectId(secondUser.userId);
    const category = await insertCategoryFixture(database.db, {
      userId: firstUserId,
      name: "Groceries",
      normalizedName: "groceries",
    });
    const recurringTag = await insertRecurringValueTagFixture(database.db, {
      userId: firstUserId,
      name: "Market",
      normalizedName: "market",
      amountCents: 200_00,
    });
    const otherUserCategory = await insertCategoryFixture(database.db, {
      userId: secondUserId,
      name: "Other Groceries",
      normalizedName: "other groceries",
    });
    const sourceRecordId = new ObjectId();
    const sourceSnapshot = {
      type: "expense",
      expenseKind: "daily",
      description: "Weekly groceries",
      fontColor: "#111827",
      backgroundColor: "#DCFCE7",
      values: [
        {
          label: "Produce",
          amountCents: 75_25,
          categoryId: category._id.toHexString(),
          recurringValueTagId: recurringTag._id.toHexString(),
          sortOrder: 0,
        },
        {
          label: "Pantry",
          amountCents: 110_00,
          sortOrder: 1,
        },
      ],
    };

    const pasteResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records/paste",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        sourceRecordId: sourceRecordId.toHexString(),
        sourceSnapshot,
        targetDate: "2026-05-02",
        targetTime: "07:15",
      },
    });
    const preserveTimePasteResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records/paste",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        sourceRecordId: sourceRecordId.toHexString(),
        sourceSnapshot: {
          ...sourceSnapshot,
          effectiveTime: "13:45",
        },
        targetDate: "2026-05-04",
      },
    });
    const invalidPasteResponse = await appInstance.inject({
      method: "POST",
      url: "/api/records/paste",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        sourceRecordId: sourceRecordId.toHexString(),
        sourceSnapshot: {
          ...sourceSnapshot,
          values: [
            {
              ...sourceSnapshot.values[0],
              categoryId: otherUserCategory._id.toHexString(),
            },
          ],
        },
        targetDate: "2026-05-03",
      },
    });

    expect(pasteResponse.statusCode).toBe(201);
    expect(pasteResponse.json()).toMatchObject({
      record: {
        effectiveAt: "2026-05-02T10:15:00.000Z",
        financeDate: "2026-05-02",
        financeMonth: "2026-05",
        totalAmountCents: 185_25,
        ...sourceSnapshot,
        values: [
          {
            label: "Produce",
            amountCents: 75_25,
            categoryId: category._id.toHexString(),
            recurringValueTagId: recurringTag._id.toHexString(),
            sortOrder: 0,
          },
          {
            label: "Pantry",
            amountCents: 110_00,
            sortOrder: 1,
          },
        ],
      },
    });
    expect(pasteResponse.json<{ record: { id: string } }>().record.id).not.toBe(
      sourceRecordId.toHexString(),
    );
    expect(preserveTimePasteResponse.statusCode).toBe(201);
    expect(preserveTimePasteResponse.json()).toMatchObject({
      record: {
        effectiveAt: "2026-05-04T16:45:00.000Z",
        financeDate: "2026-05-04",
        financeMonth: "2026-05",
      },
    });
    expect(invalidPasteResponse.statusCode).toBe(400);
  });
});
