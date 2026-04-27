export const FINANCE_TIME_ZONE = "America/Fortaleza";

const financeDateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "2-digit",
  timeZone: FINANCE_TIME_ZONE,
  year: "numeric",
});

function getDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value;
}

export function formatFinanceDate(date: Date) {
  const parts = financeDateFormatter.formatToParts(date);
  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");

  if (!year || !month || !day) {
    throw new Error("Unable to format finance date.");
  }

  return `${year}-${month}-${day}`;
}

export function formatFinanceMonth(date: Date) {
  return formatFinanceDate(date).slice(0, 7);
}

export function getFinanceMonthDayCount(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const monthNumber = Number.parseInt(monthText ?? "", 10);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error("Finance month must use YYYY-MM format.");
  }

  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

export function getFinanceMonthDateRange(month: string) {
  const endDay = String(getFinanceMonthDayCount(month)).padStart(2, "0");

  return {
    from: `${month}-01`,
    to: `${month}-${endDay}`,
  };
}
