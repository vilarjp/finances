import { describe, expect, it } from "vitest";

import { parseEnv } from "./env.js";

describe("parseEnv", () => {
  it("uses development-safe defaults", () => {
    expect(parseEnv({})).toMatchObject({
      nodeEnv: "development",
      host: "127.0.0.1",
      port: 3000,
      logLevel: "info",
      mongodbUri: "mongodb://localhost:27017/finances?replicaSet=rs0",
    });
  });

  it("rejects invalid ports", () => {
    expect(() => parseEnv({ PORT: "70000" })).toThrow("Invalid backend environment");
  });

  it("requires a cookie secret in production", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow("COOKIE_SECRET");
  });
});
