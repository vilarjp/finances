import { describe, expect, it, vi } from "vitest";

import { createConsoleLogger } from "./logger.js";

describe("console logger", () => {
  it("writes structured log lines through console.log and redacts sensitive fields", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createConsoleLogger({
      logLevel: "debug",
      nodeEnv: "development",
    });

    logger.audit("recurring_tag.amount_propagated", {
      affectedRecordCount: 1,
      amountCents: 123_45,
      label: "Private label",
      requestId: "request-1",
      token: "secret-token",
    });

    expect(consoleLog).toHaveBeenCalledTimes(1);

    const line = String(consoleLog.mock.calls[0]?.[0]);
    const parsed = JSON.parse(String(line)) as {
      context: Record<string, unknown>;
      event: string;
      level: string;
    };

    expect(parsed).toMatchObject({
      event: "recurring_tag.amount_propagated",
      level: "audit",
      context: {
        affectedRecordCount: 1,
        amountCents: "[REDACTED]",
        label: "[REDACTED]",
        requestId: "request-1",
        token: "[REDACTED]",
      },
    });
    expect(line).not.toContain("Private label");
    expect(line).not.toContain("secret-token");

    consoleLog.mockRestore();
  });

  it("suppresses logs in test mode by default", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createConsoleLogger({
      logLevel: "debug",
      nodeEnv: "test",
    });

    logger.error("request.unhandled_error");

    expect(consoleLog).not.toHaveBeenCalled();

    consoleLog.mockRestore();
  });
});
