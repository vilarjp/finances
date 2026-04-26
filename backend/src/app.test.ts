import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import type { AppLogger, AppLogContext } from "./shared/logger.js";

function createCapturingLogger() {
  const entries: Array<{ context?: AppLogContext; event: string; level: string }> = [];
  const log =
    (level: string) =>
    (event: string, context?: AppLogContext): void => {
      if (context) {
        entries.push({ context, event, level });
        return;
      }

      entries.push({ event, level });
    };
  const logger: AppLogger = {
    audit: log("audit"),
    debug: log("debug"),
    error: log("error"),
    fatal: log("fatal"),
    info: log("info"),
    trace: log("trace"),
    warn: log("warn"),
  };

  return {
    entries,
    logger,
  };
}

describe("createApp", () => {
  it("returns health status with a request id header", async () => {
    const app = await createApp({
      env: {
        NODE_ENV: "test",
        COOKIE_SECRET: "test-cookie-secret-that-is-long-enough",
      },
      logger: false,
      database: false,
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        "x-request-id": "test-request-id",
      },
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(response.json()).toMatchObject({
      status: "ok",
      service: "personal-finance-backend",
      environment: "test",
    });
  });

  it("logs completed requests through the app logging layer", async () => {
    const { entries, logger } = createCapturingLogger();
    const app = await createApp({
      appLogger: logger,
      env: {
        NODE_ENV: "test",
        COOKIE_SECRET: "test-cookie-secret-that-is-long-enough",
      },
      logger: false,
      database: false,
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        "x-request-id": "request-log-test",
      },
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    const requestLog = entries.find((entry) => entry.event === "request.completed");

    expect(requestLog).toBeDefined();
    expect(requestLog?.level).toBe("info");
    expect(requestLog?.context).toMatchObject({
      method: "GET",
      path: "/health",
      requestId: "request-log-test",
      statusCode: 200,
    });
  });

  it("allows configured CORS origins and rejects unconfigured origins", async () => {
    const app = await createApp({
      env: {
        NODE_ENV: "test",
        COOKIE_SECRET: "test-cookie-secret-that-is-long-enough",
        FRONTEND_ORIGINS: "https://finance.example.com",
      },
      logger: false,
      database: false,
    });

    const preflightResponse = await app.inject({
      method: "OPTIONS",
      url: "/api/auth/login",
      headers: {
        origin: "https://finance.example.com",
        "access-control-request-method": "POST",
      },
    });
    const rejectedResponse = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        origin: "https://evil.example.com",
      },
    });

    await app.close();

    expect(preflightResponse.statusCode).toBe(204);
    expect(preflightResponse.headers["access-control-allow-origin"]).toBe(
      "https://finance.example.com",
    );
    expect(preflightResponse.headers["access-control-allow-credentials"]).toBe("true");
    expect(rejectedResponse.statusCode).toBe(403);
    expect(rejectedResponse.json()).toMatchObject({
      error: {
        code: "FORBIDDEN",
      },
    });
  });

  it("enforces the configured request body size limit", async () => {
    const app = await createApp({
      env: {
        NODE_ENV: "test",
        COOKIE_SECRET: "test-cookie-secret-that-is-long-enough",
      },
      logger: false,
      database: false,
    });

    app.post("/echo", async (_request, reply) => reply.send({ ok: true }));

    const response = await app.inject({
      method: "POST",
      url: "/echo",
      payload: {
        value: "x".repeat(256 * 1024),
      },
    });

    await app.close();

    expect(response.statusCode).toBe(413);
  });
});
