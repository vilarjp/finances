import { describe, expect, it } from "vitest";

import { parseEnv } from "./env.js";

const cookieSecret = "test-cookie-secret-that-is-long-enough";

describe("parseEnv", () => {
  it("uses development-safe defaults", () => {
    expect(parseEnv({ COOKIE_SECRET: cookieSecret })).toMatchObject({
      nodeEnv: "development",
      host: "127.0.0.1",
      port: 3000,
      logLevel: "info",
      mongodbUri: "mongodb://localhost:27017/finances?replicaSet=rs0",
      cookieSecret,
    });
  });

  it("rejects invalid ports", () => {
    expect(() => parseEnv({ PORT: "70000", COOKIE_SECRET: cookieSecret })).toThrow(
      "Invalid backend environment",
    );
  });

  it("requires a cookie secret in every environment", () => {
    expect(() => parseEnv({ NODE_ENV: "development" })).toThrow("COOKIE_SECRET");
  });
});
