import { describe, expect, it } from "vitest";

import {
  FINANCE_TIME_ZONE,
  formatFinanceDate,
  formatFinanceMonth,
  getFinanceMonthDateRange,
  getFinanceMonthDayCount,
} from "./date";

describe("frontend finance date helpers", () => {
  it("formats dates and months in the fixed finance timezone", () => {
    expect(FINANCE_TIME_ZONE).toBe("America/Fortaleza");
    expect(formatFinanceDate(new Date("2026-04-01T02:59:59.999Z"))).toBe("2026-03-31");
    expect(formatFinanceMonth(new Date("2026-04-01T02:59:59.999Z"))).toBe("2026-03");
    expect(formatFinanceDate(new Date("2026-04-01T03:00:00.000Z"))).toBe("2026-04-01");
    expect(formatFinanceMonth(new Date("2026-04-01T03:00:00.000Z"))).toBe("2026-04");
  });

  it("derives month ranges from plain finance months", () => {
    expect(getFinanceMonthDayCount("2024-02")).toBe(29);
    expect(getFinanceMonthDateRange("2026-04")).toEqual({
      from: "2026-04-01",
      to: "2026-04-30",
    });
    expect(() => getFinanceMonthDateRange("2026-13")).toThrow("Finance month");
  });
});
