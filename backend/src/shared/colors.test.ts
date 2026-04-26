import { describe, expect, it } from "vitest";

import { HttpError } from "./errors.js";
import {
  assertColorValue,
  colorTokenSet,
  isColorValue,
  isHexColor,
  normalizeColorValue,
} from "./colors.js";

describe("color utilities", () => {
  it("accepts and normalizes #RRGGBB hex color values", () => {
    expect(isHexColor("#0f172a")).toBe(true);
    expect(normalizeColorValue("#0f172a")).toBe("#0F172A");
    expect(assertColorValue("#ABCDEF")).toBe("#ABCDEF");
  });

  it("accepts only controlled internal color tokens", () => {
    expect(isColorValue("finance-income")).toBe(true);
    expect(assertColorValue("record-default-background")).toBe("record-default-background");
    expect(colorTokenSet.has("finance-expense")).toBe(true);
  });

  it("rejects invalid CSS values and malformed hex values", () => {
    expect(isHexColor("#12345")).toBe(false);
    expect(isColorValue("var(--finance-income)")).toBe(false);
    expect(isColorValue("red")).toBe(false);
    expect(() => assertColorValue("#12GG12")).toThrow(HttpError);
  });
});
