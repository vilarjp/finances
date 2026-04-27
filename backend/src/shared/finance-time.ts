import { validationError } from "./errors.js";

export const FINANCE_TIME_ZONE = "America/Fortaleza";
export const FINANCE_TIME_ZONE_OFFSET_MINUTES = -180;

const millisecondsPerMinute = 60_000;
const financeOffsetMilliseconds = FINANCE_TIME_ZONE_OFFSET_MINUTES * millisecondsPerMinute;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
const monthPattern = /^(\d{4})-(\d{2})$/u;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/u;

export type FinanceDateParts = {
  financeDate: string;
  financeMonth: string;
};

export type CreateFinanceInstantInput = {
  date: string;
  time?: string;
};

export type FinanceMonthBoundaries = {
  month: string;
  startDate: string;
  endDate: string;
  startAt: Date;
  endAtExclusive: Date;
};

type ParsedFinanceDate = {
  year: number;
  month: number;
  day: number;
};

type ParsedFinanceMonth = {
  year: number;
  month: number;
};

type ParsedFinanceTime = {
  hour: number;
  minute: number;
};

function timeValidationError(message: string, field: string) {
  return validationError(message, {
    field,
    timeZone: FINANCE_TIME_ZONE,
  });
}

function formatTwoDigit(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${formatTwoDigit(month)}-${formatTwoDigit(day)}`;
}

function formatMonth(year: number, month: number) {
  return `${year.toString().padStart(4, "0")}-${formatTwoDigit(month)}`;
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number) {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      throw timeValidationError("Finance month must be between 01 and 12.", "month");
  }
}

function parseNumberPart(value: string, field: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed)) {
    throw timeValidationError(`${field} must be a valid number.`, field);
  }

  return parsed;
}

function parseFinanceDate(date: string): ParsedFinanceDate {
  const match = datePattern.exec(date);

  if (!match) {
    throw timeValidationError("Finance date must use YYYY-MM-DD format.", "date");
  }

  const yearText = match[1];
  const monthText = match[2];
  const dayText = match[3];

  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    throw timeValidationError("Finance date must use YYYY-MM-DD format.", "date");
  }

  const year = parseNumberPart(yearText, "year");
  const month = parseNumberPart(monthText, "month");
  const day = parseNumberPart(dayText, "day");
  const daysInMonth = getDaysInMonth(year, month);

  if (day < 1 || day > daysInMonth) {
    throw timeValidationError("Finance date contains an invalid calendar day.", "date");
  }

  return {
    year,
    month,
    day,
  };
}

function parseFinanceMonth(month: string): ParsedFinanceMonth {
  const match = monthPattern.exec(month);

  if (!match) {
    throw timeValidationError("Finance month must use YYYY-MM format.", "month");
  }

  const yearText = match[1];
  const monthText = match[2];

  if (yearText === undefined || monthText === undefined) {
    throw timeValidationError("Finance month must use YYYY-MM format.", "month");
  }

  const year = parseNumberPart(yearText, "year");
  const parsedMonth = parseNumberPart(monthText, "month");

  getDaysInMonth(year, parsedMonth);

  return {
    year,
    month: parsedMonth,
  };
}

function parseFinanceTime(time: string): ParsedFinanceTime {
  const match = timePattern.exec(time);

  if (!match) {
    throw timeValidationError("Finance time must use HH:mm format.", "time");
  }

  const hourText = match[1];
  const minuteText = match[2];

  if (hourText === undefined || minuteText === undefined) {
    throw timeValidationError("Finance time must use HH:mm format.", "time");
  }

  return {
    hour: parseNumberPart(hourText, "hour"),
    minute: parseNumberPart(minuteText, "minute"),
  };
}

function createUtcInstantFromFinanceLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
) {
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - financeOffsetMilliseconds,
  );
}

function assertValidInstant(instant: Date, field = "instant") {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw timeValidationError(`${field} must be a valid Date instant.`, field);
  }

  return instant;
}

export function deriveFinanceDateParts(instant: Date): FinanceDateParts {
  const validInstant = assertValidInstant(instant);
  const financeLocalInstant = new Date(validInstant.getTime() + financeOffsetMilliseconds);
  const year = financeLocalInstant.getUTCFullYear();
  const month = financeLocalInstant.getUTCMonth() + 1;
  const day = financeLocalInstant.getUTCDate();

  return {
    financeDate: formatDate(year, month, day),
    financeMonth: formatMonth(year, month),
  };
}

export function createFinanceInstant(input: CreateFinanceInstantInput) {
  const date = parseFinanceDate(input.date);

  if (input.time === undefined) {
    return createUtcInstantFromFinanceLocal(date.year, date.month, date.day, 23, 59, 59, 999);
  }

  const time = parseFinanceTime(input.time);

  return createUtcInstantFromFinanceLocal(
    date.year,
    date.month,
    date.day,
    time.hour,
    time.minute,
    0,
    0,
  );
}

export function createFinanceInstantPreservingLocalTime(date: string, instant: Date) {
  const parsedDate = parseFinanceDate(date);
  const validInstant = assertValidInstant(instant);
  const financeLocalInstant = new Date(validInstant.getTime() + financeOffsetMilliseconds);

  return createUtcInstantFromFinanceLocal(
    parsedDate.year,
    parsedDate.month,
    parsedDate.day,
    financeLocalInstant.getUTCHours(),
    financeLocalInstant.getUTCMinutes(),
    financeLocalInstant.getUTCSeconds(),
    financeLocalInstant.getUTCMilliseconds(),
  );
}

export function getFinanceMonthBoundaries(month: string): FinanceMonthBoundaries {
  const parsedMonth = parseFinanceMonth(month);
  const endYear = parsedMonth.month === 12 ? parsedMonth.year + 1 : parsedMonth.year;
  const endMonth = parsedMonth.month === 12 ? 1 : parsedMonth.month + 1;
  const endDay = getDaysInMonth(parsedMonth.year, parsedMonth.month);

  return {
    month: formatMonth(parsedMonth.year, parsedMonth.month),
    startDate: formatDate(parsedMonth.year, parsedMonth.month, 1),
    endDate: formatDate(parsedMonth.year, parsedMonth.month, endDay),
    startAt: createUtcInstantFromFinanceLocal(parsedMonth.year, parsedMonth.month, 1, 0, 0, 0, 0),
    endAtExclusive: createUtcInstantFromFinanceLocal(endYear, endMonth, 1, 0, 0, 0, 0),
  };
}

export function compareFinanceInstants(left: Date, right: Date) {
  const leftTime = assertValidInstant(left, "leftInstant").getTime();
  const rightTime = assertValidInstant(right, "rightInstant").getTime();

  if (leftTime < rightTime) {
    return -1;
  }

  if (leftTime > rightTime) {
    return 1;
  }

  return 0;
}

export function isAtOrAfterFinanceCutoff(instant: Date, cutoff: Date) {
  return compareFinanceInstants(instant, cutoff) >= 0;
}

export function formatFinanceDate(instant: Date) {
  return deriveFinanceDateParts(instant).financeDate;
}

export function formatFinanceMonth(instant: Date) {
  return deriveFinanceDateParts(instant).financeMonth;
}

export function formatFinanceTime(instant: Date) {
  const validInstant = assertValidInstant(instant);
  const financeLocalInstant = new Date(validInstant.getTime() + financeOffsetMilliseconds);
  const hour = financeLocalInstant.getUTCHours();
  const minute = financeLocalInstant.getUTCMinutes();

  return `${formatTwoDigit(hour)}:${formatTwoDigit(minute)}`;
}
