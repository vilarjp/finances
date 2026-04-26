import { validationError } from "./errors.js";

export const MIN_AMOUNT_CENTS = 1;
export const MAX_AMOUNT_CENTS = 999_999_999;

const currencyPrefixPattern = /^R\$/iu;
const integerPattern = /^\d+$/u;

function moneyValidationError(message: string, field = "amountCents") {
  return validationError(message, {
    field,
    maxAmountCents: MAX_AMOUNT_CENTS,
    minAmountCents: MIN_AMOUNT_CENTS,
  });
}

function assertSafeIntegerCents(amountCents: number, field = "amountCents") {
  if (!Number.isSafeInteger(amountCents)) {
    throw moneyValidationError(`${field} must be an integer number of cents.`, field);
  }

  return amountCents;
}

export function assertAmountCents(amountCents: number, field = "amountCents") {
  assertSafeIntegerCents(amountCents, field);

  if (amountCents < MIN_AMOUNT_CENTS || amountCents > MAX_AMOUNT_CENTS) {
    throw moneyValidationError(
      `${field} must be between ${MIN_AMOUNT_CENTS} and ${MAX_AMOUNT_CENTS} cents.`,
      field,
    );
  }

  return amountCents;
}

function parseGroupedInteger(integerPart: string, groupingSeparator: "." | undefined) {
  if (integerPart.length === 0) {
    throw moneyValidationError("Money input must include a whole amount.");
  }

  if (groupingSeparator === undefined || !integerPart.includes(groupingSeparator)) {
    if (!integerPattern.test(integerPart)) {
      throw moneyValidationError("Money input contains invalid whole amount digits.");
    }

    return integerPart;
  }

  const groups = integerPart.split(groupingSeparator);
  const firstGroup = groups[0];

  if (
    firstGroup === undefined ||
    !/^\d{1,3}$/u.test(firstGroup) ||
    groups.slice(1).some((group) => !/^\d{3}$/u.test(group))
  ) {
    throw moneyValidationError("Money input contains invalid thousands separators.");
  }

  return groups.join("");
}

function parseWithCommaDecimal(normalizedInput: string) {
  const parts = normalizedInput.split(",");

  if (parts.length !== 2) {
    throw moneyValidationError("Money input must contain at most one decimal separator.");
  }

  const integerPart = parts[0];
  const decimalPart = parts[1];

  if (integerPart === undefined || decimalPart === undefined || !/^\d{1,2}$/u.test(decimalPart)) {
    throw moneyValidationError("Money input can include at most two decimal digits.");
  }

  return {
    wholeDigits: parseGroupedInteger(integerPart, "."),
    decimalDigits: decimalPart.padEnd(2, "0"),
  };
}

function parseWithDotDecimalOrGrouping(normalizedInput: string) {
  const parts = normalizedInput.split(".");
  const lastPart = parts.at(-1);
  const hasOnlyGrouping =
    parts.length > 1 &&
    lastPart?.length === 3 &&
    parts[0] !== undefined &&
    /^\d{1,3}$/u.test(parts[0]) &&
    parts.slice(1).every((group) => /^\d{3}$/u.test(group));

  if (hasOnlyGrouping) {
    return {
      wholeDigits: parts.join(""),
      decimalDigits: "00",
    };
  }

  if (parts.length === 2 && lastPart !== undefined && /^\d{1,2}$/u.test(lastPart)) {
    const integerPart = parts[0];

    if (integerPart === undefined || !integerPattern.test(integerPart)) {
      throw moneyValidationError("Money input contains invalid whole amount digits.");
    }

    return {
      wholeDigits: integerPart,
      decimalDigits: lastPart.padEnd(2, "0"),
    };
  }

  throw moneyValidationError("Money input contains invalid decimal or grouping separators.");
}

function parseMoneyParts(input: string) {
  const normalizedInput = input.trim().replace(currencyPrefixPattern, "").replace(/\s/gu, "");

  if (normalizedInput.length === 0) {
    throw moneyValidationError("Money input is required.");
  }

  if (!/^[\d,.]+$/u.test(normalizedInput)) {
    throw moneyValidationError("Money input may only include digits and separators.");
  }

  if (normalizedInput.includes(",")) {
    return parseWithCommaDecimal(normalizedInput);
  }

  if (normalizedInput.includes(".")) {
    return parseWithDotDecimalOrGrouping(normalizedInput);
  }

  return {
    wholeDigits: parseGroupedInteger(normalizedInput, undefined),
    decimalDigits: "00",
  };
}

export function parseMoneyCents(input: string) {
  const { wholeDigits, decimalDigits } = parseMoneyParts(input);
  const amountCents = Number.parseInt(`${wholeDigits}${decimalDigits}`, 10);

  return assertAmountCents(amountCents);
}

export function formatMoneyCents(amountCents: number, locale = "pt-BR", currency = "BRL") {
  assertSafeIntegerCents(amountCents);

  return new Intl.NumberFormat(locale, {
    currency,
    style: "currency",
  }).format(amountCents / 100);
}

export function sumMoneyCents(amounts: readonly number[]) {
  let total = 0;

  for (const amount of amounts) {
    assertSafeIntegerCents(amount);
    total += amount;
    assertSafeIntegerCents(total, "totalAmountCents");
  }

  return total;
}

export function addMoneyCents(...amounts: readonly number[]) {
  return sumMoneyCents(amounts);
}

export function subtractMoneyCents(leftAmountCents: number, rightAmountCents: number) {
  assertSafeIntegerCents(leftAmountCents, "leftAmountCents");
  assertSafeIntegerCents(rightAmountCents, "rightAmountCents");

  return sumMoneyCents([leftAmountCents, -rightAmountCents]);
}
