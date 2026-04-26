import { describe, expect, it } from "vitest";

import {
  MAX_AMOUNT_CENTS,
  addMoneyCents,
  assertAmountCents,
  formatMoneyCents,
  parseMoneyCents,
  subtractMoneyCents,
  sumMoneyCents,
} from "./money.js";
import { HttpError } from "./errors.js";

describe("money utilities", () => {
  it("parses BRL-style money input into integer cents without floating-point drift", () => {
    expect(parseMoneyCents("R$ 1.234,56")).toBe(123_456);
    expect(parseMoneyCents("1234,5")).toBe(123_450);
    expect(parseMoneyCents("0,01")).toBe(1);
  });

  it("rejects invalid or out-of-range amount inputs", () => {
    expect(() => parseMoneyCents("")).toThrow(HttpError);
    expect(() => parseMoneyCents("12,345")).toThrow(HttpError);
    expect(() => parseMoneyCents("0,00")).toThrow(HttpError);
    expect(() => assertAmountCents(MAX_AMOUNT_CENTS + 1)).toThrow(HttpError);
  });

  it("formats cents with BRL defaults", () => {
    expect(formatMoneyCents(123_456)).toBe("R$\u00A01.234,56");
    expect(formatMoneyCents(-5_50)).toBe("-R$\u00A05,50");
  });

  it("performs safe integer-cent arithmetic", () => {
    expect(addMoneyCents(100, 250)).toBe(350);
    expect(subtractMoneyCents(100, 250)).toBe(-150);
    expect(sumMoneyCents([100, 250, -25])).toBe(325);
    expect(() => addMoneyCents(100, 0.5)).toThrow(HttpError);
  });
});
