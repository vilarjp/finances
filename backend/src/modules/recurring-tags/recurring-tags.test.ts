import type { FastifyInstance } from "fastify";
import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import type { DatabaseConnection } from "../../db/index.js";
import type { AppLogger, AppLogContext } from "../../shared/logger.js";
import {
  createRecordValueFixture,
  insertRecordFixture,
  insertRecurringValueTagFixture,
} from "../../test/repository-fixtures.js";
import { createTestDatabase, type TestDatabase } from "../../test/mongodb-memory.js";
import { RecurringTagsService } from "./recurring-tags.service.js";

const testCookieSecret = "test-cookie-secret-that-is-long-enough-for-recurring-tags";

type ResponseWithHeaders = {
  headers: Record<string, string | string[] | number | undefined>;
};

let app: FastifyInstance | undefined;
let testDatabase: TestDatabase | undefined;

function createCapturingLogger() {
  const entries: Array<{ context?: AppLogContext; event: string; level: string }> = [];
  const log =
    (level: string) =>
    (event: string, context?: AppLogContext): void => {
      if (context) {
        entries.push({ context, event, level });
        return;
      }

      entries.push({ event, level });
    };
  const logger: AppLogger = {
    audit: log("audit"),
    debug: log("debug"),
    error: log("error"),
    fatal: log("fatal"),
    info: log("info"),
    trace: log("trace"),
    warn: log("warn"),
  };

  return {
    entries,
    logger,
  };
}

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

async function createRecurringTagsApp(appLogger?: AppLogger) {
  testDatabase = await createTestDatabase();
  app = await createApp({
    ...(appLogger ? { appLogger } : {}),
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
      name: "Recurring Tag User",
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

describe("recurring-value tag routes", () => {
  it("creates, lists, and renames user-scoped recurring tags with normalized unique names", async () => {
    const { app: appInstance } = await createRecurringTagsApp();
    const firstUser = await signUp(appInstance, "first-tags@example.com");
    const secondUser = await signUp(appInstance, "second-tags@example.com");

    const createResponse = await appInstance.inject({
      method: "POST",
      url: "/api/recurring-tags",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: " Rent ",
        amountCents: 250_00,
      },
    });
    const createdTagId = createResponse.json<{ recurringTag: { id: string } }>().recurringTag.id;
    const duplicateResponse = await appInstance.inject({
      method: "POST",
      url: "/api/recurring-tags",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: "rent",
        amountCents: 300_00,
      },
    });
    const secondUserCreateResponse = await appInstance.inject({
      method: "POST",
      url: "/api/recurring-tags",
      headers: {
        cookie: secondUser.cookieHeader,
        "x-csrf-token": secondUser.csrfToken,
      },
      payload: {
        name: "Rent",
        amountCents: 400_00,
      },
    });
    const updateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/recurring-tags/${createdTagId}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: "Mortgage",
      },
    });
    const crossUserUpdateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/recurring-tags/${createdTagId}`,
      headers: {
        cookie: secondUser.cookieHeader,
        "x-csrf-token": secondUser.csrfToken,
      },
      payload: {
        name: "Not yours",
      },
    });
    const invalidAmountResponse = await appInstance.inject({
      method: "POST",
      url: "/api/recurring-tags",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: "Invalid",
        amountCents: 0,
      },
    });
    const listResponse = await appInstance.inject({
      method: "GET",
      url: "/api/recurring-tags",
      headers: {
        cookie: firstUser.cookieHeader,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      recurringTag: {
        name: "Rent",
        amountCents: 250_00,
      },
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({
      error: {
        code: "RECURRING_TAG_NAME_ALREADY_EXISTS",
      },
    });
    expect(secondUserCreateResponse.statusCode).toBe(201);
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      recurringTag: {
        name: "Mortgage",
        amountCents: 250_00,
      },
    });
    expect(crossUserUpdateResponse.statusCode).toBe(404);
    expect(invalidAmountResponse.statusCode).toBe(400);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      recurringTags: [
        {
          name: "Mortgage",
          amountCents: 250_00,
        },
      ],
    });
  });

  it("deletes a recurring tag and unlinks only that user's matching values", async () => {
    const { entries, logger } = createCapturingLogger();
    const { app: appInstance, database } = await createRecurringTagsApp(logger);
    const firstUser = await signUp(appInstance, "record-tags@example.com");
    const secondUser = await signUp(appInstance, "other-record-tags@example.com");
    const recurringTag = await insertRecurringValueTagFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      name: "Rent",
      normalizedName: "rent",
      amountCents: 900_00,
    });
    const otherUserRecurringTag = await insertRecurringValueTagFixture(database.db, {
      userId: new ObjectId(secondUser.userId),
      name: "Rent",
      normalizedName: "rent",
      amountCents: 900_00,
    });
    const firstUserRecord = await insertRecordFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      values: [
        createRecordValueFixture({
          amountCents: 900_00,
          label: "Apartment rent",
          recurringValueTagId: recurringTag._id,
        }),
        createRecordValueFixture({
          amountCents: 120_00,
          label: "One-off fee",
        }),
      ],
    });
    const secondUserRecord = await insertRecordFixture(database.db, {
      userId: new ObjectId(secondUser.userId),
      values: [
        createRecordValueFixture({
          amountCents: 900_00,
          label: "Other user's rent",
          recurringValueTagId: otherUserRecurringTag._id,
        }),
      ],
    });

    const deleteResponse = await appInstance.inject({
      method: "DELETE",
      url: `/api/recurring-tags/${recurringTag._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
    });
    const firstRecordAfterDelete = await database.collections.records.findOne({
      _id: firstUserRecord._id,
    });
    const secondRecordAfterDelete = await database.collections.records.findOne({
      _id: secondUserRecord._id,
    });
    const unlinkedValue = firstRecordAfterDelete?.values.find(
      (value) => value.label === "Apartment rent",
    );

    expect(deleteResponse.statusCode).toBe(204);
    expect(unlinkedValue).toEqual(
      expect.objectContaining({
        label: "Apartment rent",
        amountCents: 900_00,
      }),
    );
    expect(unlinkedValue).not.toHaveProperty("recurringValueTagId");
    expect(firstRecordAfterDelete?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "One-off fee",
          amountCents: 120_00,
        }),
      ]),
    );
    expect(secondRecordAfterDelete?.values[0]).toEqual(
      expect.objectContaining({
        label: "Other user's rent",
        recurringValueTagId: otherUserRecurringTag._id,
      }),
    );
    await expect(
      database.collections.recurringValueTags.findOne({
        _id: recurringTag._id,
      }),
    ).resolves.toBeNull();
    const auditLog = entries.find((entry) => entry.event === "recurring_tag.values_unlinked");

    expect(auditLog).toBeDefined();
    expect(auditLog?.level).toBe("audit");
    expect(auditLog?.context).toMatchObject({
      affectedRecordCount: 1,
      affectedValueCount: 1,
      recurringTagId: recurringTag._id.toHexString(),
      userId: firstUser.userId,
    });
    expect(typeof auditLog?.context?.requestId).toBe("string");
  });

  it("updates tag amount and propagates only future linked values for the authenticated user", async () => {
    const { entries, logger } = createCapturingLogger();
    const { app: appInstance, database } = await createRecurringTagsApp(logger);
    const firstUser = await signUp(appInstance, "propagation-owner@example.com");
    const secondUser = await signUp(appInstance, "propagation-other@example.com");
    const firstUserId = new ObjectId(firstUser.userId);
    const secondUserId = new ObjectId(secondUser.userId);
    const recurringTag = await insertRecurringValueTagFixture(database.db, {
      userId: firstUserId,
      name: "Subscription",
      normalizedName: "subscription",
      amountCents: 100_00,
    });
    const otherTag = await insertRecurringValueTagFixture(database.db, {
      userId: firstUserId,
      name: "Gym",
      normalizedName: "gym",
      amountCents: 75_00,
    });
    const pastRecord = await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2000-01-01T03:00:00.000Z"),
      financeDate: "2000-01-01",
      financeMonth: "2000-01",
      values: [
        createRecordValueFixture({
          amountCents: 100_00,
          label: "Past linked",
          recurringValueTagId: recurringTag._id,
        }),
      ],
    });
    const futureRecord = await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2100-01-01T03:00:00.000Z"),
      financeDate: "2100-01-01",
      financeMonth: "2100-01",
      values: [
        createRecordValueFixture({
          amountCents: 100_00,
          label: "Future linked one",
          recurringValueTagId: recurringTag._id,
        }),
        createRecordValueFixture({
          amountCents: 100_00,
          label: "Future linked two",
          recurringValueTagId: recurringTag._id,
        }),
        createRecordValueFixture({
          amountCents: 75_00,
          label: "Other tag",
          recurringValueTagId: otherTag._id,
        }),
        createRecordValueFixture({
          amountCents: 50_00,
          label: "Unlinked",
        }),
      ],
    });
    const secondUserRecord = await insertRecordFixture(database.db, {
      userId: secondUserId,
      effectiveAt: new Date("2100-01-01T03:00:00.000Z"),
      financeDate: "2100-01-01",
      financeMonth: "2100-01",
      values: [
        createRecordValueFixture({
          amountCents: 100_00,
          label: "Second user's future linked",
          recurringValueTagId: recurringTag._id,
        }),
      ],
    });

    const updateAmountResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/recurring-tags/${recurringTag._id.toHexString()}/amount`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        amountCents: 333_33,
      },
    });
    const pastRecordAfterUpdate = await database.collections.records.findOne({
      _id: pastRecord._id,
    });
    const futureRecordAfterUpdate = await database.collections.records.findOne({
      _id: futureRecord._id,
    });
    const secondUserRecordAfterUpdate = await database.collections.records.findOne({
      _id: secondUserRecord._id,
    });

    expect(updateAmountResponse.statusCode).toBe(200);
    expect(updateAmountResponse.json()).toMatchObject({
      propagation: {
        affectedRecordCount: 1,
        affectedValueCount: 2,
        skippedPastValueCount: 1,
      },
      recurringTag: {
        amountCents: 333_33,
        name: "Subscription",
      },
    });
    expect(
      updateAmountResponse.json<{ propagation: { cutoffAt: string } }>().propagation.cutoffAt,
    ).toEqual(expect.any(String));
    expect(pastRecordAfterUpdate?.values[0]).toEqual(
      expect.objectContaining({
        amountCents: 100_00,
        label: "Past linked",
      }),
    );
    expect(
      futureRecordAfterUpdate?.values
        .filter((value) => value.recurringValueTagId?.equals(recurringTag._id))
        .map((value) => value.amountCents),
    ).toEqual([333_33, 333_33]);
    expect(futureRecordAfterUpdate?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amountCents: 75_00,
          label: "Other tag",
        }),
        expect.objectContaining({
          amountCents: 50_00,
          label: "Unlinked",
        }),
      ]),
    );
    expect(secondUserRecordAfterUpdate?.values[0]).toEqual(
      expect.objectContaining({
        amountCents: 100_00,
        label: "Second user's future linked",
      }),
    );
    const auditLog = entries.find((entry) => entry.event === "recurring_tag.amount_propagated");

    expect(auditLog).toBeDefined();
    expect(auditLog?.level).toBe("audit");
    expect(auditLog?.context).toMatchObject({
      affectedRecordCount: 1,
      affectedValueCount: 2,
      recurringTagId: recurringTag._id.toHexString(),
      skippedPastValueCount: 1,
      userId: firstUser.userId,
    });
    expect(typeof auditLog?.context?.cutoffAt).toBe("string");
    expect(typeof auditLog?.context?.requestId).toBe("string");
    expect(JSON.stringify(entries)).not.toContain("Future linked one");
    expect(JSON.stringify(entries)).not.toContain("33333");
  });

  it("includes records at the exact cutoff timestamp in recurring amount propagation", async () => {
    const database = await createTestDatabase();
    testDatabase = database;
    const userId = new ObjectId();
    const cutoff = new Date("2026-04-26T15:00:00.000Z");
    const recurringTag = await insertRecurringValueTagFixture(database.db, {
      userId,
      name: "Salary",
      normalizedName: "salary",
      amountCents: 1_000_00,
    });
    const beforeCutoffRecord = await insertRecordFixture(database.db, {
      userId,
      effectiveAt: new Date(cutoff.getTime() - 1),
      financeDate: "2026-04-26",
      financeMonth: "2026-04",
      values: [
        createRecordValueFixture({
          amountCents: 1_000_00,
          label: "Before cutoff",
          recurringValueTagId: recurringTag._id,
        }),
      ],
    });
    const exactCutoffRecord = await insertRecordFixture(database.db, {
      userId,
      effectiveAt: cutoff,
      financeDate: "2026-04-26",
      financeMonth: "2026-04",
      values: [
        createRecordValueFixture({
          amountCents: 1_000_00,
          label: "Exact cutoff",
          recurringValueTagId: recurringTag._id,
        }),
      ],
    });
    const service = new RecurringTagsService(createDatabaseConnection(database));

    const result = await service.updateRecurringTagAmount(
      userId,
      recurringTag._id,
      {
        amountCents: 1_500_00,
      },
      cutoff,
    );
    const beforeCutoffAfterUpdate = await database.collections.records.findOne({
      _id: beforeCutoffRecord._id,
    });
    const exactCutoffAfterUpdate = await database.collections.records.findOne({
      _id: exactCutoffRecord._id,
    });

    expect(result.propagation).toEqual({
      affectedRecordCount: 1,
      affectedValueCount: 1,
      cutoffAt: cutoff,
      skippedPastValueCount: 1,
    });
    expect(beforeCutoffAfterUpdate?.values[0]).toEqual(
      expect.objectContaining({
        amountCents: 1_000_00,
      }),
    );
    expect(exactCutoffAfterUpdate?.values[0]).toEqual(
      expect.objectContaining({
        amountCents: 1_500_00,
      }),
    );
  });
});
