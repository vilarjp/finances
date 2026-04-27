import { describe, expect, it } from "vitest";

import { parseEnv } from "./env.js";

const cookieSecret = "test-cookie-secret-that-is-long-enough";

describe("parseEnv", () => {
  it("uses development-safe defaults", () => {
    expect(parseEnv({ COOKIE_SECRET: cookieSecret })).toMatchObject({
      authRateLimit: {
        maxAttempts: 20,
        windowMs: 60_000,
      },
      frontendOrigins: ["http://127.0.0.1:5173", "http://localhost:5173"],
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

  it("parses configured frontend origins and auth rate limit settings", () => {
    expect(
      parseEnv({
        AUTH_RATE_LIMIT_MAX_ATTEMPTS: "3",
        AUTH_RATE_LIMIT_WINDOW_MS: "5000",
        COOKIE_SECRET: cookieSecret,
        FRONTEND_ORIGINS: "https://finance.example.com",
        MONGODB_URI: "mongodb://mongo.example.com:27017/finances",
        NODE_ENV: "production",
      }),
    ).toMatchObject({
      authRateLimit: {
        maxAttempts: 3,
        windowMs: 5_000,
      },
      frontendOrigins: ["https://finance.example.com"],
    });
  });

  it("requires explicit production-safe environment values", () => {
    expect(() =>
      parseEnv({
        COOKIE_SECRET: cookieSecret,
        FRONTEND_ORIGINS: "https://finance.example.com",
        NODE_ENV: "production",
      }),
    ).toThrow("MONGODB_URI");
    expect(() =>
      parseEnv({
        COOKIE_SECRET: "replace-with-at-least-32-character-secret",
        FRONTEND_ORIGINS: "https://finance.example.com",
        MONGODB_URI: "mongodb://mongo.example.com:27017/finances",
        NODE_ENV: "production",
      }),
    ).toThrow("COOKIE_SECRET");
    expect(() =>
      parseEnv({
        COOKIE_SECRET: cookieSecret,
        FRONTEND_ORIGINS: "http://localhost:5173",
        MONGODB_URI: "mongodb://mongo.example.com:27017/finances",
        NODE_ENV: "production",
      }),
    ).toThrow("FRONTEND_ORIGINS");
  });

  it("rejects invalid frontend origins", () => {
    expect(() =>
      parseEnv({
        COOKIE_SECRET: cookieSecret,
        FRONTEND_ORIGINS: "https://finance.example.com/path",
      }),
    ).toThrow("FRONTEND_ORIGINS");
  });
});
