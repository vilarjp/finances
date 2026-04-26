import { validationError } from "./errors.js";

export const colorTokens = [
  "background",
  "foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "finance-income",
  "finance-expense",
  "finance-daily",
  "finance-balance-positive",
  "finance-balance-negative",
  "record-default-background",
  "record-default-foreground",
] as const;

export type ColorToken = (typeof colorTokens)[number];
export type HexColor = `#${string}`;
export type ColorValue = HexColor | ColorToken;

export const colorTokenSet: ReadonlySet<ColorToken> = new Set(colorTokens);

const hexColorPattern = /^#[\da-f]{6}$/iu;

function colorValidationError(field: string) {
  return validationError(`${field} must be a #RRGGBB hex color or supported color token.`, {
    field,
    supportedTokens: colorTokens,
  });
}

export function isHexColor(value: unknown): value is HexColor {
  return typeof value === "string" && hexColorPattern.test(value);
}

export function normalizeHexColor(value: unknown, field = "color"): HexColor {
  if (!isHexColor(value)) {
    throw colorValidationError(field);
  }

  return value.toUpperCase() as HexColor;
}

export function isColorToken(value: unknown): value is ColorToken {
  return typeof value === "string" && colorTokenSet.has(value as ColorToken);
}

export function isColorValue(value: unknown): value is ColorValue {
  return isHexColor(value) || isColorToken(value);
}

export function normalizeColorValue(value: unknown, field = "color"): ColorValue {
  if (isHexColor(value)) {
    return normalizeHexColor(value, field);
  }

  if (isColorToken(value)) {
    return value;
  }

  throw colorValidationError(field);
}

export function assertColorValue(value: unknown, field = "color") {
  return normalizeColorValue(value, field);
}
