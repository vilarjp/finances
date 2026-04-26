import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

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
});
