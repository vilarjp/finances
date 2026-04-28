import { expect, test } from "@playwright/test";
import type { Locator, Page, Route } from "@playwright/test";

type User = {
  email: string;
  id: string;
  name: string;
};

type Category = {
  backgroundColor: string;
  createdAt: string;
  fontColor: string;
  id: string;
  name: string;
  updatedAt: string;
};

type RecurringTag = {
  amountCents: number;
  createdAt: string;
  id: string;
  lastAmountUpdatedAt: string;
  name: string;
  updatedAt: string;
};

type RecordType = "income" | "expense";
type ExpenseKind = "daily" | "fixed";

type RecordValue = {
  amountCents: number;
  category?: Category;
  categoryId?: string;
  createdAt: string;
  id: string;
  label: string;
  recurringValueTag?: RecurringTag;
  recurringValueTagId?: string;
  sortOrder: number;
  updatedAt: string;
};

type FinanceRecord = {
  backgroundColor: string;
  createdAt: string;
  description: string;
  effectiveAt: string;
  expenseKind: ExpenseKind | null;
  financeDate: string;
  financeMonth: string;
  fontColor: string;
  id: string;
  totalAmountCents: number;
  type: RecordType;
  updatedAt: string;
  values: RecordValue[];
};

type FinanceRow = {
  balanceCents: number;
  dailyExpenseRecords: FinanceRecord[];
  dailyExpenseTotalCents: number;
  date: string;
  fixedExpenseRecords: FinanceRecord[];
  fixedExpenseTotalCents: number;
  incomeRecords: FinanceRecord[];
  incomeTotalCents: number;
};

type RecordMutationPayload = {
  backgroundColor: string;
  description: string;
  effectiveDate: string;
  effectiveTime?: string;
  expenseKind?: ExpenseKind | null;
  fontColor: string;
  type: RecordType;
  values: Array<{
    amountCents: number;
    categoryId?: string;
    label: string;
    recurringValueTagId?: string;
    sortOrder: number;
  }>;
};

type PasteRecordPayload = {
  sourceRecordId?: string;
  sourceSnapshot: {
    backgroundColor: string;
    description: string;
    expenseKind?: ExpenseKind | null;
    fontColor: string;
    type: RecordType;
    values: Array<{
      amountCents: number;
      categoryId?: string;
      label: string;
      recurringValueTagId?: string;
      sortOrder: number;
    }>;
  };
  targetDate: string;
  targetTime?: string;
};

type FinanceApiState = {
  categories: Category[];
  currentUser: User | null;
  nextRecordNumber: number;
  records: FinanceRecord[];
  recurringTags: RecurringTag[];
  usersByEmail: Map<string, User>;
};

const testUser: User = {
  email: "ada@example.com",
  id: "user-1",
  name: "Ada Lovelace",
};
const createdAt = "2026-04-26T12:00:00.000Z";
const homeDate = "2026-04-26";

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    backgroundColor: "#FEF3C7",
    createdAt,
    fontColor: "#111827",
    id: "category-food",
    name: "Food",
    updatedAt: createdAt,
    ...overrides,
  };
}

function makeRecurringTag(overrides: Partial<RecurringTag> = {}): RecurringTag {
  return {
    amountCents: 50000,
    createdAt,
    id: "tag-rent",
    lastAmountUpdatedAt: createdAt,
    name: "Rent",
    updatedAt: createdAt,
    ...overrides,
  };
}

function makeRecord({
  backgroundColor = "#DCFCE7",
  description,
  expenseKind = "daily",
  financeDate = homeDate,
  fontColor = "#111827",
  id,
  type = "expense",
  values,
}: {
  backgroundColor?: string;
  description: string;
  expenseKind?: ExpenseKind | null;
  financeDate?: string;
  fontColor?: string;
  id: string;
  type?: RecordType;
  values: Array<{
    amountCents: number;
    categoryId?: string;
    label: string;
    recurringValueTagId?: string;
  }>;
}): FinanceRecord {
  const recordValues = values.map((value, index) => ({
    amountCents: value.amountCents,
    createdAt,
    id: `${id}-value-${index + 1}`,
    label: value.label,
    sortOrder: index,
    updatedAt: createdAt,
    ...(value.categoryId ? { categoryId: value.categoryId } : {}),
    ...(value.recurringValueTagId ? { recurringValueTagId: value.recurringValueTagId } : {}),
  }));

  return {
    backgroundColor,
    createdAt,
    description,
    effectiveAt: `${financeDate}T12:00:00.000Z`,
    expenseKind: type === "income" ? null : expenseKind,
    financeDate,
    financeMonth: financeDate.slice(0, 7),
    fontColor,
    id,
    totalAmountCents: recordValues.reduce((total, value) => total + value.amountCents, 0),
    type,
    updatedAt: createdAt,
    values: recordValues,
  };
}

function cloneRecordWithLookups(record: FinanceRecord, state: FinanceApiState): FinanceRecord {
  return {
    ...record,
    values: record.values.map((value) => {
      const category = value.categoryId
        ? state.categories.find((item) => item.id === value.categoryId)
        : undefined;
      const recurringValueTag = value.recurringValueTagId
        ? state.recurringTags.find((item) => item.id === value.recurringValueTagId)
        : undefined;

      return {
        ...value,
        ...(category ? { category } : {}),
        ...(recurringValueTag ? { recurringValueTag } : {}),
      };
    }),
  };
}

function buildFinanceRow(date: string, state: FinanceApiState): FinanceRow {
  const records = state.records
    .filter((record) => record.financeDate === date)
    .map((record) => cloneRecordWithLookups(record, state));
  const incomeRecords = records.filter((record) => record.type === "income");
  const fixedExpenseRecords = records.filter(
    (record) => record.type === "expense" && record.expenseKind === "fixed",
  );
  const dailyExpenseRecords = records.filter(
    (record) => record.type === "expense" && record.expenseKind === "daily",
  );
  const incomeTotalCents = getTotalCents(incomeRecords);
  const fixedExpenseTotalCents = getTotalCents(fixedExpenseRecords);
  const dailyExpenseTotalCents = getTotalCents(dailyExpenseRecords);

  return {
    balanceCents: incomeTotalCents - fixedExpenseTotalCents - dailyExpenseTotalCents,
    dailyExpenseRecords,
    dailyExpenseTotalCents,
    date,
    fixedExpenseRecords,
    fixedExpenseTotalCents,
    incomeRecords,
    incomeTotalCents,
  };
}

function getTotalCents(records: FinanceRecord[]) {
  return records.reduce((total, record) => total + record.totalAmountCents, 0);
}

function buildCategoryBreakdown(state: FinanceApiState, type: RecordType) {
  const totals = new Map<
    string,
    {
      category: Category | null;
      label: string;
      totalAmountCents: number;
    }
  >();

  for (const record of state.records) {
    if (record.financeMonth !== "2026-04" || record.type !== type) {
      continue;
    }

    for (const value of record.values) {
      const category = value.categoryId
        ? (state.categories.find((item) => item.id === value.categoryId) ?? null)
        : null;
      const key = category?.id ?? "uncategorized";
      const current = totals.get(key) ?? {
        category,
        label: category?.name ?? "Uncategorized",
        totalAmountCents: 0,
      };

      current.category = category;
      current.label = category?.name ?? "Uncategorized";
      current.totalAmountCents += value.amountCents;
      totals.set(key, current);
    }
  }

  return [...totals.values()];
}

function buildHomeReport(state: FinanceApiState) {
  return {
    currentDayRow: buildFinanceRow(homeDate, state),
    currentMonth: "2026-04",
    currentMonthExpenseByCategory: buildCategoryBreakdown(state, "expense"),
    currentMonthIncomeByCategory: buildCategoryBreakdown(state, "income"),
    dailyBalanceSeries: {
      currentMonth: [
        { balanceCents: 10000, date: "2026-04-01", dayOfMonth: 1 },
        { balanceCents: 25000, date: "2026-04-02", dayOfMonth: 2 },
      ],
      previousMonth: [
        { balanceCents: 5000, date: "2026-03-01", dayOfMonth: 1 },
        { balanceCents: -2500, date: "2026-03-02", dayOfMonth: 2 },
      ],
    },
    date: homeDate,
    previousMonth: "2026-03",
    fiveDayRows: [
      buildFinanceRow(homeDate, state),
      buildFinanceRow("2026-04-27", state),
      buildFinanceRow("2026-04-28", state),
      buildFinanceRow("2026-04-29", state),
      buildFinanceRow("2026-04-30", state),
    ],
  };
}

function buildMonthlyReport(month: string, state: FinanceApiState) {
  const dates = new Set(
    state.records
      .filter((record) => record.financeMonth === month)
      .map((record) => record.financeDate),
  );

  return {
    month,
    rows: [...dates].sort().map((date) => buildFinanceRow(date, state)),
  };
}

function recordFromPayload(payload: RecordMutationPayload, id: string): FinanceRecord {
  return makeRecord({
    backgroundColor: payload.backgroundColor,
    description: payload.description,
    expenseKind: payload.type === "income" ? null : (payload.expenseKind ?? "daily"),
    financeDate: payload.effectiveDate,
    fontColor: payload.fontColor,
    id,
    type: payload.type,
    values: payload.values,
  });
}

function recordFromPastePayload(payload: PasteRecordPayload, id: string): FinanceRecord {
  return makeRecord({
    backgroundColor: payload.sourceSnapshot.backgroundColor,
    description: payload.sourceSnapshot.description,
    expenseKind:
      payload.sourceSnapshot.type === "income"
        ? null
        : (payload.sourceSnapshot.expenseKind ?? "daily"),
    financeDate: payload.targetDate,
    fontColor: payload.sourceSnapshot.fontColor,
    id,
    type: payload.sourceSnapshot.type,
    values: payload.sourceSnapshot.values,
  });
}

function readJsonBody<TBody>(route: Route): TBody {
  const postData = route.request().postData();

  if (!postData) {
    return {} as TBody;
  }

  return JSON.parse(postData) as TBody;
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    contentType: "application/json",
    json,
    status,
  });
}

function createFinanceApiState(overrides: Partial<FinanceApiState> = {}): FinanceApiState {
  return {
    categories: [],
    currentUser: testUser,
    nextRecordNumber: 1,
    records: [],
    recurringTags: [],
    usersByEmail: new Map([[testUser.email, testUser]]),
    ...overrides,
  };
}

async function installFinanceApiMock(page: Page, state: FinanceApiState) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (method === "GET" && path === "/api/auth/me") {
      if (!state.currentUser) {
        await fulfillJson(route, { message: "Unauthenticated" }, 401);
        return;
      }

      await fulfillJson(route, { user: state.currentUser });
      return;
    }

    if (method === "GET" && path === "/api/auth/csrf") {
      await fulfillJson(route, { csrfToken: "test-csrf-token" });
      return;
    }

    if (method === "POST" && path === "/api/auth/signup") {
      const body = readJsonBody<Pick<User, "email" | "name">>(route);
      const user = {
        email: body.email,
        id: "user-workflow",
        name: body.name,
      };

      state.currentUser = user;
      state.usersByEmail.set(user.email, user);
      await fulfillJson(route, { user }, 201);
      return;
    }

    if (method === "POST" && path === "/api/auth/login") {
      const body = readJsonBody<Pick<User, "email">>(route);
      const user = state.usersByEmail.get(body.email) ?? testUser;

      state.currentUser = user;
      await fulfillJson(route, { user });
      return;
    }

    if (method === "POST" && path === "/api/auth/logout") {
      state.currentUser = null;
      await route.fulfill({ status: 204 });
      return;
    }

    if (method === "POST" && path === "/api/auth/refresh") {
      await route.fulfill({ status: state.currentUser ? 204 : 401 });
      return;
    }

    if (method === "GET" && path === "/api/categories") {
      await fulfillJson(route, { categories: state.categories });
      return;
    }

    if (method === "PATCH" && path.startsWith("/api/categories/")) {
      const categoryId = path.replace("/api/categories/", "");
      const body = readJsonBody<Pick<Category, "backgroundColor" | "fontColor" | "name">>(route);
      const category = state.categories.find((item) => item.id === categoryId);

      if (!category) {
        await fulfillJson(route, { error: { message: "Category not found." } }, 404);
        return;
      }

      Object.assign(category, body, { updatedAt: "2026-04-26T12:05:00.000Z" });
      await fulfillJson(route, { category });
      return;
    }

    if (method === "GET" && path === "/api/recurring-tags") {
      await fulfillJson(route, { recurringTags: state.recurringTags });
      return;
    }

    if (method === "PATCH" && path.endsWith("/amount")) {
      const recurringTagId = path.replace("/api/recurring-tags/", "").replace("/amount", "");
      const body = readJsonBody<{ amountCents: number }>(route);
      const recurringTag = state.recurringTags.find((item) => item.id === recurringTagId);

      if (!recurringTag) {
        await fulfillJson(route, { error: { message: "Recurring tag not found." } }, 404);
        return;
      }

      recurringTag.amountCents = body.amountCents;
      recurringTag.lastAmountUpdatedAt = "2026-04-26T15:00:00.000Z";
      recurringTag.updatedAt = "2026-04-26T15:00:00.000Z";

      let affectedRecordCount = 0;
      let affectedValueCount = 0;
      let skippedPastValueCount = 0;

      for (const record of state.records) {
        let changedRecord = false;

        for (const value of record.values) {
          if (value.recurringValueTagId !== recurringTagId) {
            continue;
          }

          if (record.financeDate < homeDate) {
            skippedPastValueCount += 1;
            continue;
          }

          value.amountCents = body.amountCents;
          value.updatedAt = recurringTag.updatedAt;
          affectedValueCount += 1;
          changedRecord = true;
        }

        if (changedRecord) {
          record.totalAmountCents = record.values.reduce(
            (total, value) => total + value.amountCents,
            0,
          );
          record.updatedAt = recurringTag.updatedAt;
          affectedRecordCount += 1;
        }
      }

      await fulfillJson(route, {
        propagation: {
          affectedRecordCount,
          affectedValueCount,
          cutoffAt: recurringTag.lastAmountUpdatedAt,
          skippedPastValueCount,
        },
        recurringTag,
      });
      return;
    }

    if (method === "GET" && path === "/api/records") {
      const from = url.searchParams.get("from") ?? "";
      const to = url.searchParams.get("to") ?? "";
      const records = state.records
        .filter(
          (record) => (!from || record.financeDate >= from) && (!to || record.financeDate <= to),
        )
        .map((record) => cloneRecordWithLookups(record, state));

      await fulfillJson(route, { records });
      return;
    }

    if (method === "POST" && path === "/api/records") {
      const payload = readJsonBody<RecordMutationPayload>(route);
      const record = recordFromPayload(payload, `record-${state.nextRecordNumber}`);

      state.nextRecordNumber += 1;
      state.records.push(record);
      await fulfillJson(route, { record: cloneRecordWithLookups(record, state) }, 201);
      return;
    }

    if (method === "POST" && path === "/api/records/paste") {
      const payload = readJsonBody<PasteRecordPayload>(route);
      const record = recordFromPastePayload(payload, `record-${state.nextRecordNumber}`);

      state.nextRecordNumber += 1;
      state.records.push(record);
      await fulfillJson(route, { record: cloneRecordWithLookups(record, state) }, 201);
      return;
    }

    if (method === "PATCH" && path.startsWith("/api/records/")) {
      const recordId = path.replace("/api/records/", "");
      const payload = readJsonBody<RecordMutationPayload>(route);
      const recordIndex = state.records.findIndex((record) => record.id === recordId);

      if (recordIndex === -1) {
        await fulfillJson(route, { error: { message: "Record not found." } }, 404);
        return;
      }

      const record = recordFromPayload(payload, recordId);

      state.records[recordIndex] = record;
      await fulfillJson(route, { record: cloneRecordWithLookups(record, state) });
      return;
    }

    if (method === "GET" && path === "/api/reports/home") {
      await fulfillJson(route, buildHomeReport(state));
      return;
    }

    if (method === "GET" && path === "/api/reports/month") {
      await fulfillJson(
        route,
        buildMonthlyReport(url.searchParams.get("month") ?? "2026-04", state),
      );
      return;
    }

    await fulfillJson(
      route,
      { error: { message: `Unhandled mock route ${method} ${path}.` } },
      500,
    );
  });
}

async function openCreateRecordEditor(page: Page) {
  await page.getByRole("button", { name: "New record" }).click();

  return page.getByRole("dialog", { name: "Create record" });
}

async function saveRecordFromEditor(
  editor: Locator,
  {
    classification,
    description,
    effectiveDate = homeDate,
    values,
  }: {
    classification: "Daily expense" | "Fixed expense" | "Income";
    description: string;
    effectiveDate?: string;
    values: Array<{ amountCents: string; label: string }>;
  },
) {
  await editor.getByLabel("Record description").fill(description);
  await editor.getByLabel("Effective date").fill(effectiveDate);
  await editor.getByLabel(classification).check();

  for (const [index, value] of values.entries()) {
    if (index > 0) {
      await editor.getByRole("button", { name: "Add value" }).click();
    }

    const valueNumber = index + 1;

    await editor.getByLabel(`Value ${valueNumber} label`).fill(value.label);
    await editor.getByLabel(`Value ${valueNumber} amount cents`).fill(value.amountCents);
  }

  await editor.getByRole("button", { name: "Save record" }).click();
}

test("supports sign up, logout, and login", async ({ page }) => {
  const state = createFinanceApiState({ currentUser: null });

  await installFinanceApiMock(page, state);
  await page.goto("/sign-up");

  await page.getByLabel("Name").fill("Workflow Tester");
  await page.getByLabel("Email").fill("workflow@example.com");
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
  await expect(page.getByText("Workflow Tester")).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  await page.getByLabel("Email").fill("workflow@example.com");
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
  await expect(page.getByText("Workflow Tester")).toBeVisible();
});

test("creates income, fixed expense, and daily expense records", async ({ page }) => {
  const state = createFinanceApiState();

  await installFinanceApiMock(page, state);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();

  await saveRecordFromEditor(await openCreateRecordEditor(page), {
    classification: "Income",
    description: "April income",
    values: [
      { amountCents: "200000", label: "Salary" },
      { amountCents: "50000", label: "Bonus" },
    ],
  });

  await expect(page.getByText("Saved April income.")).toBeVisible();
  await expect(page.getByLabel(`Income records for ${homeDate}`)).toContainText("April income");
  await expect(page.getByLabel(`Income records for ${homeDate}`)).toContainText("Salary");
  await expect(page.getByLabel(`Income records for ${homeDate}`)).toContainText("Bonus");

  await saveRecordFromEditor(await openCreateRecordEditor(page), {
    classification: "Fixed expense",
    description: "Apartment rent",
    values: [{ amountCents: "90000", label: "Rent" }],
  });

  await expect(page.getByText("Saved Apartment rent.")).toBeVisible();
  await expect(page.getByLabel(`Fixed expense records for ${homeDate}`)).toContainText(
    "Apartment rent",
  );
  await expect(page.getByLabel(`Fixed expense records for ${homeDate}`)).toContainText(
    "Fixed expense",
  );

  await saveRecordFromEditor(await openCreateRecordEditor(page), {
    classification: "Daily expense",
    description: "Lunch",
    values: [{ amountCents: "3500", label: "Cafe" }],
  });

  await expect(page.getByText("Saved Lunch.")).toBeVisible();
  await expect(page.getByLabel(`Daily expense records for ${homeDate}`)).toContainText("Lunch");
  await expect(page.getByLabel(`Daily expense records for ${homeDate}`)).toContainText(
    "Daily expense",
  );
});

test("copies a record and pastes it onto another day", async ({ page }) => {
  const state = createFinanceApiState({
    records: [
      makeRecord({
        description: "Consulting",
        id: "record-consulting",
        type: "income",
        values: [{ amountCents: 250000, label: "Client work" }],
      }),
    ],
  });

  await installFinanceApiMock(page, state);
  await page.goto("/monthly?month=2026-04");

  await page.getByRole("button", { name: "Copy Consulting record" }).click();
  await expect(page.getByText("Ready to paste Consulting.")).toBeVisible();

  await page.getByRole("button", { name: "Select 2026-04-28" }).click();
  await page.getByRole("button", { name: "Paste copied record" }).click();

  await expect(page.getByText("Pasted Consulting to 2026-04-28.")).toBeVisible();
  await expect(page.getByLabel("Income records for 2026-04-28")).toContainText("Consulting");
  await expect(page.getByLabel("Income records for 2026-04-28")).toContainText("Client work");
});

test("updates recurring tag amount only for current and future linked records", async ({
  page,
}) => {
  const recurringTag = makeRecurringTag();
  const state = createFinanceApiState({
    recurringTags: [recurringTag],
    records: [
      makeRecord({
        description: "Past subscription",
        financeDate: "2026-04-20",
        id: "record-past-subscription",
        values: [
          {
            amountCents: 50000,
            label: "Subscription",
            recurringValueTagId: recurringTag.id,
          },
        ],
      }),
      makeRecord({
        description: "Future subscription",
        financeDate: "2026-04-28",
        id: "record-future-subscription",
        values: [
          {
            amountCents: 50000,
            label: "Subscription",
            recurringValueTagId: recurringTag.id,
          },
        ],
      }),
    ],
  });

  await installFinanceApiMock(page, state);
  await page.goto("/categories-and-tags");

  await expect(page.getByRole("heading", { name: "Categories & Recurring tags" })).toBeVisible();

  await page.getByRole("combobox", { name: "Recurring tag" }).selectOption(recurringTag.id);
  await page.getByRole("spinbutton", { name: "Shared amount cents" }).fill("70000");
  await page.getByRole("button", { name: "Update shared amount" }).click();

  await expect(page.getByText("Updated 1 value in 1 record.")).toBeVisible();

  await page.goto("/monthly?month=2026-04");

  await expect(page.getByLabel("Daily expense records for 2026-04-20")).toContainText("R$ 500,00");
  await expect(page.getByLabel("Daily expense records for 2026-04-28")).toContainText("R$ 700,00");
});

test("covers home desktop and mobile carousel layouts", async ({ page }) => {
  const salaryCategory = makeCategory({
    backgroundColor: "#DCFCE7",
    id: "category-salary",
    name: "Salary",
  });
  const foodCategory = makeCategory({
    backgroundColor: "#DBEAFE",
    id: "category-food",
    name: "Food",
  });
  const state = createFinanceApiState({
    categories: [salaryCategory, foodCategory],
    records: [
      makeRecord({
        description: "Payroll",
        id: "record-payroll",
        type: "income",
        values: [{ amountCents: 200000, categoryId: salaryCategory.id, label: "Salary" }],
      }),
      makeRecord({
        description: "Dinner",
        id: "record-dinner",
        values: [{ amountCents: 4500, categoryId: foodCategory.id, label: "Food" }],
      }),
    ],
  });

  await installFinanceApiMock(page, state);

  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Personal Finance" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Summary cards" })).toContainText("Today's income");
  await expect(page.getByRole("region", { name: "Charts" })).toContainText("Salary");
  await expect(page.getByRole("table", { name: "Today + 4 days" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1280);

  await page.setViewportSize({ height: 844, width: 390 });
  await page.reload();

  await expect(page.getByRole("region", { name: "Summary cards" })).toHaveAttribute(
    "aria-roledescription",
    "carousel",
  );
  await expect(page.getByRole("region", { name: "Charts" })).toHaveAttribute(
    "aria-roledescription",
    "carousel",
  );
  await expect(page.getByRole("region", { name: "Today + 4 days" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});

test("navigates monthly view and edits a monthly record", async ({ page }) => {
  const state = createFinanceApiState({
    records: [
      makeRecord({
        description: "Consulting",
        financeDate: "2024-02-14",
        id: "record-consulting",
        type: "income",
        values: [{ amountCents: 250000, label: "Client work" }],
      }),
    ],
  });

  await installFinanceApiMock(page, state);
  await page.goto("/monthly?month=2024-02");

  await expect(page.getByRole("heading", { name: "February 2024" })).toBeVisible();

  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.getByRole("heading", { name: "March 2024" })).toBeVisible();

  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.getByRole("heading", { name: "February 2024" })).toBeVisible();

  await page.getByRole("button", { name: "Edit Consulting record" }).click();

  const editor = page.getByRole("dialog", { name: "Edit record" });

  await editor.getByLabel("Record description").fill("Consulting amended");
  await editor.getByRole("button", { name: "Save record" }).click();

  await expect(page.getByText("Updated Consulting amended.")).toBeVisible();
  await expect(page.getByLabel("Income records for 2024-02-14")).toContainText(
    "Consulting amended",
  );
});
