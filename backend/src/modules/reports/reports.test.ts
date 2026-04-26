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
import type { HomeReportResponse, MonthlyReportResponse } from "./reports.schemas.js";

const testCookieSecret = "test-cookie-secret-that-is-long-enough-for-reports";

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

async function createReportsApp() {
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
      name: "Reports User",
      email,
      password: "correct horse battery staple",
    },
  });

  return {
    cookieHeader: cookieHeaderFromResponse(response),
    userId: response.json<{ user: { id: string } }>().user.id,
  };
}

describe("report routes", () => {
  it("returns home rows, category totals, and balance series from value-level amounts", async () => {
    const { app: appInstance, database } = await createReportsApp();
    const firstUser = await signUp(appInstance, "reports@example.com");
    const secondUser = await signUp(appInstance, "other-reports@example.com");
    const firstUserId = new ObjectId(firstUser.userId);
    const secondUserId = new ObjectId(secondUser.userId);
    const salaryCategory = await insertCategoryFixture(database.db, {
      userId: firstUserId,
      name: "Salary",
      normalizedName: "salary",
      fontColor: "#111827",
      backgroundColor: "#DCFCE7",
    });
    const housingCategory = await insertCategoryFixture(database.db, {
      userId: firstUserId,
      name: "Housing",
      normalizedName: "housing",
      fontColor: "#111827",
      backgroundColor: "#DBEAFE",
    });
    const groceriesCategory = await insertCategoryFixture(database.db, {
      userId: firstUserId,
      name: "Groceries",
      normalizedName: "groceries",
      fontColor: "#111827",
      backgroundColor: "#FEF3C7",
    });
    const salaryTag = await insertRecurringValueTagFixture(database.db, {
      userId: firstUserId,
      name: "Paycheck",
      normalizedName: "paycheck",
      amountCents: 3_000_00,
    });
    const rentTag = await insertRecurringValueTagFixture(database.db, {
      userId: firstUserId,
      name: "Rent",
      normalizedName: "rent",
      amountCents: 1_500_00,
    });

    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-04-25T11:30:00.000Z"),
      financeDate: "2026-04-25",
      financeMonth: "2026-04",
      type: "income",
      expenseKind: null,
      description: "Paycheck",
      values: [
        createRecordValueFixture({
          label: "Salary",
          amountCents: 3_000_00,
          categoryId: salaryCategory._id,
          recurringValueTagId: salaryTag._id,
          sortOrder: 0,
        }),
        createRecordValueFixture({
          label: "Bonus",
          amountCents: 500_00,
          sortOrder: 1,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-04-25T15:00:00.000Z"),
      financeDate: "2026-04-25",
      financeMonth: "2026-04",
      type: "expense",
      expenseKind: "fixed",
      description: "Apartment",
      values: [
        createRecordValueFixture({
          label: "Rent",
          amountCents: 1_500_00,
          categoryId: housingCategory._id,
          recurringValueTagId: rentTag._id,
          sortOrder: 0,
        }),
        createRecordValueFixture({
          label: "Utilities",
          amountCents: 250_00,
          sortOrder: 1,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-04-25T19:00:00.000Z"),
      financeDate: "2026-04-25",
      financeMonth: "2026-04",
      type: "expense",
      expenseKind: "daily",
      description: "Lunch",
      values: [
        createRecordValueFixture({
          label: "Meal",
          amountCents: 35_00,
          categoryId: groceriesCategory._id,
          sortOrder: 0,
        }),
        createRecordValueFixture({
          label: "Snack",
          amountCents: 15_00,
          categoryId: groceriesCategory._id,
          sortOrder: 1,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-04-26T10:00:00.000Z"),
      financeDate: "2026-04-26",
      financeMonth: "2026-04",
      type: "income",
      expenseKind: null,
      values: [
        createRecordValueFixture({
          label: "Freelance",
          amountCents: 100_00,
          categoryId: salaryCategory._id,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-04-26T20:00:00.000Z"),
      financeDate: "2026-04-26",
      financeMonth: "2026-04",
      type: "expense",
      expenseKind: "daily",
      values: [
        createRecordValueFixture({
          label: "Taxi",
          amountCents: 30_00,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-03-25T12:00:00.000Z"),
      financeDate: "2026-03-25",
      financeMonth: "2026-03",
      type: "income",
      expenseKind: null,
      values: [
        createRecordValueFixture({
          label: "Previous income",
          amountCents: 200_00,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: firstUserId,
      effectiveAt: new Date("2026-03-25T18:00:00.000Z"),
      financeDate: "2026-03-25",
      financeMonth: "2026-03",
      type: "expense",
      expenseKind: "daily",
      values: [
        createRecordValueFixture({
          label: "Previous expense",
          amountCents: 50_00,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId: secondUserId,
      effectiveAt: new Date("2026-04-25T12:00:00.000Z"),
      financeDate: "2026-04-25",
      financeMonth: "2026-04",
      type: "income",
      expenseKind: null,
      values: [
        createRecordValueFixture({
          label: "Other user's income",
          amountCents: 9_999_00,
        }),
      ],
    });

    const response = await appInstance.inject({
      method: "GET",
      url: "/api/reports/home?date=2026-04-25",
      headers: {
        cookie: firstUser.cookieHeader,
      },
    });
    const report = response.json<HomeReportResponse>();

    expect(response.statusCode).toBe(200);
    expect(report).toMatchObject({
      date: "2026-04-25",
      currentDayRow: {
        date: "2026-04-25",
        incomeTotalCents: 3_500_00,
        fixedExpenseTotalCents: 1_750_00,
        dailyExpenseTotalCents: 50_00,
        balanceCents: 1_700_00,
      },
      threeDayRows: [
        {
          date: "2026-04-25",
          balanceCents: 1_700_00,
        },
        {
          date: "2026-04-26",
          balanceCents: 70_00,
        },
        {
          date: "2026-04-27",
          balanceCents: 0,
        },
      ],
      currentMonthIncomeByCategory: [
        {
          category: salaryCategoryResponse(salaryCategory),
          totalAmountCents: 3_100_00,
        },
        {
          category: null,
          label: "Uncategorized",
          totalAmountCents: 500_00,
        },
      ],
      currentMonthExpenseByCategory: [
        {
          category: groceriesCategoryResponse(groceriesCategory),
          totalAmountCents: 50_00,
        },
        {
          category: housingCategoryResponse(housingCategory),
          totalAmountCents: 1_500_00,
        },
        {
          category: null,
          label: "Uncategorized",
          totalAmountCents: 280_00,
        },
      ],
    });
    expect(report.currentDayRow.incomeRecords).toHaveLength(1);
    expect(report.currentDayRow.fixedExpenseRecords).toHaveLength(1);
    expect(report.currentDayRow.dailyExpenseRecords).toHaveLength(1);
    const salaryValue = report.currentDayRow.incomeRecords[0]?.values.find(
      (value) => value.label === "Salary",
    );
    const currentDayLabels = [
      ...report.currentDayRow.incomeRecords,
      ...report.currentDayRow.fixedExpenseRecords,
      ...report.currentDayRow.dailyExpenseRecords,
    ].flatMap((record) => record.values.map((value) => value.label));

    expect(salaryValue).toMatchObject({
      label: "Salary",
      amountCents: 3_000_00,
      category: salaryCategoryResponse(salaryCategory),
      recurringValueTag: {
        id: salaryTag._id.toHexString(),
        name: "Paycheck",
        amountCents: 3_000_00,
      },
    });
    expect(currentDayLabels).not.toContain("Other user's income");
    expect(report.dailyBalanceSeries.currentMonth).toHaveLength(30);
    expect(report.dailyBalanceSeries.previousMonth).toHaveLength(31);
    expect(report.dailyBalanceSeries.currentMonth).toEqual(
      expect.arrayContaining([
        {
          date: "2026-04-25",
          dayOfMonth: 25,
          balanceCents: 1_700_00,
        },
        {
          date: "2026-04-26",
          dayOfMonth: 26,
          balanceCents: 70_00,
        },
      ]),
    );
    expect(report.dailyBalanceSeries.previousMonth).toEqual(
      expect.arrayContaining([
        {
          date: "2026-03-25",
          dayOfMonth: 25,
          balanceCents: 150_00,
        },
      ]),
    );
  });

  it("returns one monthly row for each finance date and rejects invalid month queries", async () => {
    const { app: appInstance, database } = await createReportsApp();
    const user = await signUp(appInstance, "monthly-reports@example.com");
    const userId = new ObjectId(user.userId);
    const category = await insertCategoryFixture(database.db, {
      userId,
      name: "Work",
      normalizedName: "work",
    });

    await insertRecordFixture(database.db, {
      userId,
      effectiveAt: new Date("2026-02-10T12:00:00.000Z"),
      financeDate: "2026-02-10",
      financeMonth: "2026-02",
      type: "income",
      expenseKind: null,
      values: [
        createRecordValueFixture({
          label: "Client A",
          amountCents: 400_00,
          categoryId: category._id,
          sortOrder: 0,
        }),
        createRecordValueFixture({
          label: "Client B",
          amountCents: 600_00,
          categoryId: category._id,
          sortOrder: 1,
        }),
      ],
    });
    await insertRecordFixture(database.db, {
      userId,
      effectiveAt: new Date("2026-02-10T19:00:00.000Z"),
      financeDate: "2026-02-10",
      financeMonth: "2026-02",
      type: "expense",
      expenseKind: "fixed",
      values: [
        createRecordValueFixture({
          label: "Software",
          amountCents: 250_00,
          sortOrder: 0,
        }),
      ],
    });

    const response = await appInstance.inject({
      method: "GET",
      url: "/api/reports/month?month=2026-02",
      headers: {
        cookie: user.cookieHeader,
      },
    });
    const invalidResponse = await appInstance.inject({
      method: "GET",
      url: "/api/reports/month?month=2026-13",
      headers: {
        cookie: user.cookieHeader,
      },
    });
    const monthlyReport = response.json<MonthlyReportResponse>();

    expect(response.statusCode).toBe(200);
    expect(monthlyReport.month).toBe("2026-02");
    expect(Array.isArray(monthlyReport.rows)).toBe(true);
    expect(monthlyReport.rows).toHaveLength(28);
    expect(monthlyReport.rows[9]).toMatchObject({
      date: "2026-02-10",
      incomeTotalCents: 1_000_00,
      fixedExpenseTotalCents: 250_00,
      dailyExpenseTotalCents: 0,
      balanceCents: 750_00,
      incomeRecords: [
        {
          values: [
            {
              label: "Client A",
              amountCents: 400_00,
              category: salaryCategoryResponse(category),
            },
            {
              label: "Client B",
              amountCents: 600_00,
              category: salaryCategoryResponse(category),
            },
          ],
        },
      ],
      fixedExpenseRecords: [
        {
          values: [
            {
              label: "Software",
              amountCents: 250_00,
            },
          ],
        },
      ],
      dailyExpenseRecords: [],
    });
    expect(invalidResponse.statusCode).toBe(400);
  });
});

function salaryCategoryResponse(category: {
  _id: ObjectId;
  name: string;
  fontColor: string;
  backgroundColor: string;
}) {
  return {
    id: category._id.toHexString(),
    name: category.name,
    fontColor: category.fontColor,
    backgroundColor: category.backgroundColor,
  };
}

function housingCategoryResponse(category: {
  _id: ObjectId;
  name: string;
  fontColor: string;
  backgroundColor: string;
}) {
  return {
    id: category._id.toHexString(),
    name: category.name,
    fontColor: category.fontColor,
    backgroundColor: category.backgroundColor,
  };
}

function groceriesCategoryResponse(category: {
  _id: ObjectId;
  name: string;
  fontColor: string;
  backgroundColor: string;
}) {
  return {
    id: category._id.toHexString(),
    name: category.name,
    fontColor: category.fontColor,
    backgroundColor: category.backgroundColor,
  };
}
