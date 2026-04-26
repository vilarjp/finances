import type { ObjectId } from "mongodb";

import type {
  CategoryDocument,
  DatabaseConnection,
  RecordDocument,
  RecordValueDocument,
  RecurringValueTagDocument,
} from "../../db/index.js";
import { validationError } from "../../shared/errors.js";
import { createFinanceInstant, getFinanceMonthBoundaries } from "../../shared/finance-time.js";
import { sumMoneyCents } from "../../shared/money.js";
import { ReportsRepository } from "./reports.repository.js";
import type {
  CategoryBreakdownItemResponse,
  DailyBalancePointResponse,
  FinanceRowResponse,
  HomeReportQuery,
  HomeReportResponse,
  MonthlyReportQuery,
  MonthlyReportResponse,
  ReportCategorySummary,
  ReportRecordResponse,
  ReportRecordValueResponse,
  ReportRecurringValueTagSummary,
} from "./reports.schemas.js";

const uncategorizedBreakdownKey = "uncategorized";
const uncategorizedLabel = "Uncategorized";

type ReportLookupMaps = {
  categories: ReadonlyMap<string, CategoryDocument>;
  recurringTags: ReadonlyMap<string, RecurringValueTagDocument>;
};

type ParsedFinanceDate = {
  year: number;
  month: number;
  day: number;
};

function assertFinanceDate(date: string) {
  createFinanceInstant({
    date,
    time: "00:00",
  });

  return date;
}

function parseFinanceDate(date: string): ParsedFinanceDate {
  assertFinanceDate(date);

  const [yearText, monthText, dayText] = date.split("-");

  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    throw validationError("Finance date must use YYYY-MM-DD format.", {
      field: "date",
    });
  }

  return {
    year: Number.parseInt(yearText, 10),
    month: Number.parseInt(monthText, 10),
    day: Number.parseInt(dayText, 10),
  };
}

function formatTwoDigit(value: number) {
  return value.toString().padStart(2, "0");
}

function formatFinanceDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${formatTwoDigit(month)}-${formatTwoDigit(day)}`;
}

function formatFinanceMonth(year: number, month: number) {
  return `${year.toString().padStart(4, "0")}-${formatTwoDigit(month)}`;
}

function addFinanceDays(date: string, days: number) {
  const parsedDate = parseFinanceDate(date);
  const calendarDate = new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day));

  calendarDate.setUTCDate(calendarDate.getUTCDate() + days);

  return formatFinanceDate(
    calendarDate.getUTCFullYear(),
    calendarDate.getUTCMonth() + 1,
    calendarDate.getUTCDate(),
  );
}

function listFinanceDates(from: string, to: string) {
  assertFinanceDate(from);
  assertFinanceDate(to);

  if (from > to) {
    throw validationError("Finance date range start must be before or equal to range end.", {
      field: "from",
    });
  }

  const dates: string[] = [];
  let cursor = from;

  while (cursor <= to) {
    dates.push(cursor);
    cursor = addFinanceDays(cursor, 1);
  }

  return dates;
}

function getFinanceMonthFromDate(date: string) {
  assertFinanceDate(date);

  return date.slice(0, 7);
}

function getPreviousFinanceMonth(month: string) {
  const canonicalMonth = getFinanceMonthBoundaries(month).month;
  const [yearText, monthText] = canonicalMonth.split("-");

  if (yearText === undefined || monthText === undefined) {
    throw validationError("Finance month must use YYYY-MM format.", {
      field: "month",
    });
  }

  const year = Number.parseInt(yearText, 10);
  const parsedMonth = Number.parseInt(monthText, 10);

  if (parsedMonth === 1) {
    return formatFinanceMonth(year - 1, 12);
  }

  return formatFinanceMonth(year, parsedMonth - 1);
}

function getDayOfMonth(date: string) {
  return parseFinanceDate(date).day;
}

function mapById<TDocument extends { _id: ObjectId }>(documents: readonly TDocument[]) {
  return new Map(documents.map((document) => [document._id.toHexString(), document]));
}

function collectUniqueValueIds(
  records: readonly RecordDocument[],
  selectId: (value: RecordValueDocument) => ObjectId | undefined,
) {
  const idsByHex = new Map<string, ObjectId>();

  for (const record of records) {
    for (const value of record.values) {
      const id = selectId(value);

      if (id) {
        idsByHex.set(id.toHexString(), id);
      }
    }
  }

  return [...idsByHex.values()];
}

function uniqueRecords(records: readonly RecordDocument[]) {
  const recordsById = new Map<string, RecordDocument>();

  for (const record of records) {
    recordsById.set(record._id.toHexString(), record);
  }

  return [...recordsById.values()];
}

function toCategorySummary(category: CategoryDocument): ReportCategorySummary {
  return {
    id: category._id.toHexString(),
    name: category.name,
    fontColor: category.fontColor,
    backgroundColor: category.backgroundColor,
  };
}

function toRecurringTagSummary(
  recurringTag: RecurringValueTagDocument,
): ReportRecurringValueTagSummary {
  return {
    id: recurringTag._id.toHexString(),
    name: recurringTag.name,
    amountCents: recurringTag.amountCents,
    lastAmountUpdatedAt: recurringTag.lastAmountUpdatedAt.toISOString(),
  };
}

function toReportRecordValue(
  value: RecordValueDocument,
  maps: ReportLookupMaps,
): ReportRecordValueResponse {
  const response: ReportRecordValueResponse = {
    id: value._id.toHexString(),
    label: value.label,
    amountCents: value.amountCents,
    sortOrder: value.sortOrder,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };

  if (value.categoryId) {
    const categoryId = value.categoryId.toHexString();
    const category = maps.categories.get(categoryId);

    response.categoryId = categoryId;

    if (category) {
      response.category = toCategorySummary(category);
    }
  }

  if (value.recurringValueTagId) {
    const recurringValueTagId = value.recurringValueTagId.toHexString();
    const recurringValueTag = maps.recurringTags.get(recurringValueTagId);

    response.recurringValueTagId = recurringValueTagId;

    if (recurringValueTag) {
      response.recurringValueTag = toRecurringTagSummary(recurringValueTag);
    }
  }

  return response;
}

function toReportRecord(record: RecordDocument, maps: ReportLookupMaps): ReportRecordResponse {
  const values = record.values
    .toSorted((left, right) => left.sortOrder - right.sortOrder)
    .map((value) => toReportRecordValue(value, maps));

  return {
    id: record._id.toHexString(),
    effectiveAt: record.effectiveAt.toISOString(),
    financeDate: record.financeDate,
    financeMonth: record.financeMonth,
    type: record.type,
    expenseKind: record.expenseKind,
    description: record.description,
    fontColor: record.fontColor,
    backgroundColor: record.backgroundColor,
    values,
    totalAmountCents: sumMoneyCents(values.map((value) => value.amountCents)),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function getRecordsTotalCents(records: readonly ReportRecordResponse[]) {
  return sumMoneyCents(
    records.flatMap((record) => record.values.map((value) => value.amountCents)),
  );
}

function createFinanceRow(
  date: string,
  records: readonly RecordDocument[],
  maps: ReportLookupMaps,
): FinanceRowResponse {
  const incomeRecords = records
    .filter((record) => record.type === "income")
    .map((record) => toReportRecord(record, maps));
  const fixedExpenseRecords = records
    .filter((record) => record.type === "expense" && record.expenseKind === "fixed")
    .map((record) => toReportRecord(record, maps));
  const dailyExpenseRecords = records
    .filter((record) => record.type === "expense" && record.expenseKind === "daily")
    .map((record) => toReportRecord(record, maps));
  const incomeTotalCents = getRecordsTotalCents(incomeRecords);
  const fixedExpenseTotalCents = getRecordsTotalCents(fixedExpenseRecords);
  const dailyExpenseTotalCents = getRecordsTotalCents(dailyExpenseRecords);

  return {
    date,
    incomeRecords,
    fixedExpenseRecords,
    dailyExpenseRecords,
    incomeTotalCents,
    fixedExpenseTotalCents,
    dailyExpenseTotalCents,
    balanceCents: sumMoneyCents([
      incomeTotalCents,
      -fixedExpenseTotalCents,
      -dailyExpenseTotalCents,
    ]),
  };
}

function groupRecordsByFinanceDate(records: readonly RecordDocument[]) {
  const recordsByDate = new Map<string, RecordDocument[]>();

  for (const record of records) {
    const recordsForDate = recordsByDate.get(record.financeDate) ?? [];

    recordsForDate.push(record);
    recordsByDate.set(record.financeDate, recordsForDate);
  }

  return recordsByDate;
}

function createRowsForDates(
  dates: readonly string[],
  records: readonly RecordDocument[],
  maps: ReportLookupMaps,
) {
  const recordsByDate = groupRecordsByFinanceDate(records);

  return dates.map((date) => createFinanceRow(date, recordsByDate.get(date) ?? [], maps));
}

function addCategoryBreakdownAmount(
  totalsByKey: Map<string, CategoryBreakdownItemResponse>,
  value: RecordValueDocument,
  maps: ReportLookupMaps,
) {
  const categoryId = value.categoryId?.toHexString();
  const category = categoryId ? maps.categories.get(categoryId) : undefined;
  const key = category ? category._id.toHexString() : uncategorizedBreakdownKey;
  const existing = totalsByKey.get(key);

  if (existing) {
    existing.totalAmountCents = sumMoneyCents([existing.totalAmountCents, value.amountCents]);

    return;
  }

  totalsByKey.set(key, {
    category: category ? toCategorySummary(category) : null,
    label: category?.name ?? uncategorizedLabel,
    totalAmountCents: value.amountCents,
  });
}

function sortCategoryBreakdown(
  items: Iterable<CategoryBreakdownItemResponse>,
): CategoryBreakdownItemResponse[] {
  return [...items].toSorted((left, right) => {
    if (left.category === null && right.category !== null) {
      return 1;
    }

    if (right.category === null && left.category !== null) {
      return -1;
    }

    return left.label.localeCompare(right.label);
  });
}

function createCategoryBreakdowns(records: readonly RecordDocument[], maps: ReportLookupMaps) {
  const incomeTotalsByKey = new Map<string, CategoryBreakdownItemResponse>();
  const expenseTotalsByKey = new Map<string, CategoryBreakdownItemResponse>();

  for (const record of records) {
    const totalsByKey = record.type === "income" ? incomeTotalsByKey : expenseTotalsByKey;

    for (const value of record.values) {
      addCategoryBreakdownAmount(totalsByKey, value, maps);
    }
  }

  return {
    incomeByCategory: sortCategoryBreakdown(incomeTotalsByKey.values()),
    expenseByCategory: sortCategoryBreakdown(expenseTotalsByKey.values()),
  };
}

function createBalanceSeries(rows: readonly FinanceRowResponse[]): DailyBalancePointResponse[] {
  return rows.map((row) => ({
    date: row.date,
    dayOfMonth: getDayOfMonth(row.date),
    balanceCents: row.balanceCents,
  }));
}

export class ReportsService {
  private readonly repository: ReportsRepository;

  constructor(connection: DatabaseConnection) {
    this.repository = new ReportsRepository(connection);
  }

  async getHomeReport(userId: ObjectId, query: HomeReportQuery): Promise<HomeReportResponse> {
    const date = assertFinanceDate(query.date);
    const currentMonth = getFinanceMonthFromDate(date);
    const previousMonth = getPreviousFinanceMonth(currentMonth);
    const currentMonthBoundaries = getFinanceMonthBoundaries(currentMonth);
    const previousMonthBoundaries = getFinanceMonthBoundaries(previousMonth);
    const threeDayEndDate = addFinanceDays(date, 2);
    const [currentMonthRecords, previousMonthRecords, threeDayRecords] = await Promise.all([
      this.repository.listRecordsByFinanceDateRange({
        userId,
        from: currentMonthBoundaries.startDate,
        to: currentMonthBoundaries.endDate,
      }),
      this.repository.listRecordsByFinanceDateRange({
        userId,
        from: previousMonthBoundaries.startDate,
        to: previousMonthBoundaries.endDate,
      }),
      this.repository.listRecordsByFinanceDateRange({
        userId,
        from: date,
        to: threeDayEndDate,
      }),
    ]);
    const maps = await this.loadLookupMaps(
      userId,
      uniqueRecords([...currentMonthRecords, ...previousMonthRecords, ...threeDayRecords]),
    );
    const currentMonthRows = createRowsForDates(
      listFinanceDates(currentMonthBoundaries.startDate, currentMonthBoundaries.endDate),
      currentMonthRecords,
      maps,
    );
    const previousMonthRows = createRowsForDates(
      listFinanceDates(previousMonthBoundaries.startDate, previousMonthBoundaries.endDate),
      previousMonthRecords,
      maps,
    );
    const threeDayRows = createRowsForDates(
      listFinanceDates(date, threeDayEndDate),
      threeDayRecords,
      maps,
    );
    const currentDayRow = threeDayRows.find((row) => row.date === date);

    if (!currentDayRow) {
      throw new Error("Expected home report to include the requested date row.");
    }

    const categoryBreakdowns = createCategoryBreakdowns(currentMonthRecords, maps);

    return {
      date,
      currentMonth,
      previousMonth,
      currentDayRow,
      threeDayRows,
      currentMonthIncomeByCategory: categoryBreakdowns.incomeByCategory,
      currentMonthExpenseByCategory: categoryBreakdowns.expenseByCategory,
      dailyBalanceSeries: {
        currentMonth: createBalanceSeries(currentMonthRows),
        previousMonth: createBalanceSeries(previousMonthRows),
      },
    };
  }

  async getMonthlyReport(
    userId: ObjectId,
    query: MonthlyReportQuery,
  ): Promise<MonthlyReportResponse> {
    const boundaries = getFinanceMonthBoundaries(query.month);
    const records = await this.repository.listRecordsByFinanceDateRange({
      userId,
      from: boundaries.startDate,
      to: boundaries.endDate,
    });
    const maps = await this.loadLookupMaps(userId, records);

    return {
      month: boundaries.month,
      rows: createRowsForDates(
        listFinanceDates(boundaries.startDate, boundaries.endDate),
        records,
        maps,
      ),
    };
  }

  private async loadLookupMaps(
    userId: ObjectId,
    records: readonly RecordDocument[],
  ): Promise<ReportLookupMaps> {
    const [categories, recurringTags] = await Promise.all([
      this.repository.listCategoriesByIds({
        userId,
        categoryIds: collectUniqueValueIds(records, (value) => value.categoryId),
      }),
      this.repository.listRecurringTagsByIds({
        userId,
        recurringTagIds: collectUniqueValueIds(records, (value) => value.recurringValueTagId),
      }),
    ]);

    return {
      categories: mapById(categories),
      recurringTags: mapById(recurringTags),
    };
  }
}
