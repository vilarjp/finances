import type { FastifyInstance } from "fastify";
import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import type { DatabaseConnection } from "../../db/index.js";
import {
  createRecordValueFixture,
  insertCategoryFixture,
  insertRecordFixture,
} from "../../test/repository-fixtures.js";
import { createTestDatabase, type TestDatabase } from "../../test/mongodb-memory.js";

const testCookieSecret = "test-cookie-secret-that-is-long-enough-for-categories";

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

async function createCategoryApp() {
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
      name: "Category User",
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

describe("category routes", () => {
  it("creates and lists user-scoped categories with normalized unique names", async () => {
    const { app: appInstance } = await createCategoryApp();
    const firstUser = await signUp(appInstance, "first@example.com");
    const secondUser = await signUp(appInstance, "second@example.com");

    const createResponse = await appInstance.inject({
      method: "POST",
      url: "/api/categories",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: " Groceries ",
        fontColor: "#111827",
        backgroundColor: "#fef3c7",
      },
    });
    const duplicateResponse = await appInstance.inject({
      method: "POST",
      url: "/api/categories",
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: "groceries",
        fontColor: "#111827",
        backgroundColor: "#FEF3C7",
      },
    });
    const secondUserCreateResponse = await appInstance.inject({
      method: "POST",
      url: "/api/categories",
      headers: {
        cookie: secondUser.cookieHeader,
        "x-csrf-token": secondUser.csrfToken,
      },
      payload: {
        name: "Groceries",
        fontColor: "#111827",
        backgroundColor: "#FEF3C7",
      },
    });
    const listResponse = await appInstance.inject({
      method: "GET",
      url: "/api/categories",
      headers: {
        cookie: firstUser.cookieHeader,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      category: {
        name: "Groceries",
        fontColor: "#111827",
        backgroundColor: "#FEF3C7",
      },
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({
      error: {
        code: "CATEGORY_NAME_ALREADY_EXISTS",
      },
    });
    expect(secondUserCreateResponse.statusCode).toBe(201);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      categories: [
        {
          name: "Groceries",
        },
      ],
    });
  });

  it("updates only the authenticated user's category and validates payloads", async () => {
    const { app: appInstance, database } = await createCategoryApp();
    const firstUser = await signUp(appInstance, "owner@example.com");
    const secondUser = await signUp(appInstance, "other@example.com");
    const firstCategory = await insertCategoryFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      name: "Transport",
      normalizedName: "transport",
    });

    await insertCategoryFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      name: "Groceries",
      normalizedName: "groceries",
    });

    const updateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/categories/${firstCategory._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: "Transit",
        fontColor: "#F9FAFB",
        backgroundColor: "finance-expense",
      },
    });
    const duplicateUpdateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/categories/${firstCategory._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        name: " groceries ",
      },
    });
    const crossUserUpdateResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/categories/${firstCategory._id.toHexString()}`,
      headers: {
        cookie: secondUser.cookieHeader,
        "x-csrf-token": secondUser.csrfToken,
      },
      payload: {
        name: "Not yours",
      },
    });
    const invalidPayloadResponse = await appInstance.inject({
      method: "PATCH",
      url: `/api/categories/${firstCategory._id.toHexString()}`,
      headers: {
        cookie: firstUser.cookieHeader,
        "x-csrf-token": firstUser.csrfToken,
      },
      payload: {
        backgroundColor: "var(--unsafe)",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      category: {
        name: "Transit",
        fontColor: "#F9FAFB",
        backgroundColor: "finance-expense",
      },
    });
    expect(duplicateUpdateResponse.statusCode).toBe(409);
    expect(duplicateUpdateResponse.json()).toMatchObject({
      error: {
        code: "CATEGORY_NAME_ALREADY_EXISTS",
      },
    });
    expect(crossUserUpdateResponse.statusCode).toBe(404);
    expect(invalidPayloadResponse.statusCode).toBe(400);
  });

  it("deletes a category and unlinks only that user's matching record values", async () => {
    const { app: appInstance, database } = await createCategoryApp();
    const firstUser = await signUp(appInstance, "record-owner@example.com");
    const secondUser = await signUp(appInstance, "other-record-owner@example.com");
    const category = await insertCategoryFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      name: "Bills",
      normalizedName: "bills",
    });
    const otherUserCategory = await insertCategoryFixture(database.db, {
      userId: new ObjectId(secondUser.userId),
      name: "Bills",
      normalizedName: "bills",
    });
    const firstUserRecord = await insertRecordFixture(database.db, {
      userId: new ObjectId(firstUser.userId),
      values: [
        createRecordValueFixture({
          amountCents: 123_45,
          categoryId: category._id,
          label: "Electric bill",
        }),
        createRecordValueFixture({
          amountCents: 678_90,
          label: "Uncategorized already",
        }),
      ],
    });
    const secondUserRecord = await insertRecordFixture(database.db, {
      userId: new ObjectId(secondUser.userId),
      values: [
        createRecordValueFixture({
          amountCents: 500_00,
          categoryId: otherUserCategory._id,
          label: "Other user's bill",
        }),
      ],
    });

    const deleteResponse = await appInstance.inject({
      method: "DELETE",
      url: `/api/categories/${category._id.toHexString()}`,
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
      (value) => value.label === "Electric bill",
    );

    expect(deleteResponse.statusCode).toBe(204);
    expect(unlinkedValue).toEqual(
      expect.objectContaining({
        label: "Electric bill",
        amountCents: 123_45,
      }),
    );
    expect(unlinkedValue).not.toHaveProperty("categoryId");
    expect(firstRecordAfterDelete?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Uncategorized already",
          amountCents: 678_90,
        }),
      ]),
    );
    expect(secondRecordAfterDelete?.values[0]).toEqual(
      expect.objectContaining({
        categoryId: otherUserCategory._id,
        label: "Other user's bill",
      }),
    );
    await expect(
      database.collections.categories.findOne({
        _id: category._id,
      }),
    ).resolves.toBeNull();
  });
});
