import { describe, expect, it } from "vitest";

import { HttpError } from "./errors.js";
import {
  FINANCE_TIME_ZONE,
  compareFinanceInstants,
  createFinanceInstant,
  createFinanceInstantPreservingLocalTime,
  deriveFinanceDateParts,
  formatFinanceTime,
  getFinanceMonthBoundaries,
  isAtOrAfterFinanceCutoff,
} from "./finance-time.js";

describe("finance timezone utilities", () => {
  it("derives finance dates and months in the fixed GMT-3 business timezone", () => {
    expect(FINANCE_TIME_ZONE).toBe("America/Fortaleza");
    expect(deriveFinanceDateParts(new Date("2026-04-01T02:59:59.999Z"))).toEqual({
      financeDate: "2026-03-31",
      financeMonth: "2026-03",
    });
    expect(deriveFinanceDateParts(new Date("2026-04-01T03:00:00.000Z"))).toEqual({
      financeDate: "2026-04-01",
      financeMonth: "2026-04",
    });
  });

  it("creates UTC instants from strict finance date and optional HH:mm input", () => {
    expect(createFinanceInstant({ date: "2026-04-25" }).toISOString()).toBe(
      "2026-04-26T02:59:59.999Z",
    );
    expect(createFinanceInstant({ date: "2026-04-25", time: "08:30" }).toISOString()).toBe(
      "2026-04-25T11:30:00.000Z",
    );
  });

  it("formats finance-local HH:mm from UTC instants", () => {
    expect(formatFinanceTime(new Date("2026-04-25T11:30:00.000Z"))).toBe("08:30");
    expect(formatFinanceTime(new Date("2026-04-26T02:59:59.999Z"))).toBe("23:59");
  });

  it("moves an instant to a new finance date while preserving exact local time", () => {
    expect(
      createFinanceInstantPreservingLocalTime(
        "2026-04-26",
        new Date("2026-04-25T11:30:15.123Z"),
      ).toISOString(),
    ).toBe("2026-04-26T11:30:15.123Z");
    expect(
      createFinanceInstantPreservingLocalTime(
        "2026-04-26",
        new Date("2026-04-26T02:59:59.999Z"),
      ).toISOString(),
    ).toBe("2026-04-27T02:59:59.999Z");
  });

  it("returns month boundary instants in finance-local time", () => {
    const boundaries = getFinanceMonthBoundaries("2026-02");

    expect(boundaries).toEqual({
      month: "2026-02",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      startAt: new Date("2026-02-01T03:00:00.000Z"),
      endAtExclusive: new Date("2026-03-01T03:00:00.000Z"),
    });
  });

  it("compares full instants for recurring cutoff rules", () => {
    const cutoff = new Date("2026-04-25T12:00:00.000Z");

    expect(compareFinanceInstants(new Date("2026-04-25T11:59:59.999Z"), cutoff)).toBe(-1);
    expect(compareFinanceInstants(new Date("2026-04-25T12:00:00.000Z"), cutoff)).toBe(0);
    expect(compareFinanceInstants(new Date("2026-04-25T12:00:00.001Z"), cutoff)).toBe(1);
    expect(isAtOrAfterFinanceCutoff(new Date("2026-04-25T12:00:00.000Z"), cutoff)).toBe(true);
  });

  it("rejects invalid date, month, time, and instant inputs", () => {
    expect(() => createFinanceInstant({ date: "2026-02-29" })).toThrow(HttpError);
    expect(() => createFinanceInstant({ date: "2026-04-25", time: "24:00" })).toThrow(HttpError);
    expect(() => getFinanceMonthBoundaries("2026-13")).toThrow(HttpError);
    expect(() => deriveFinanceDateParts(new Date(Number.NaN))).toThrow(HttpError);
  });
});
