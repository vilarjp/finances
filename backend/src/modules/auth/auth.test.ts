import type { FastifyInstance } from "fastify";
import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import type { DatabaseConnection } from "../../db/index.js";
import { createTestDatabase, type TestDatabase } from "../../test/mongodb-memory.js";

const accessCookieName = "__Host-finance_access";
const refreshCookieName = "__Host-finance_refresh";
const testCookieSecret = "test-cookie-secret-that-is-long-enough-for-auth";

type ResponseWithHeaders = {
  headers: Record<string, string | string[] | number | undefined>;
};

let app: FastifyInstance | undefined;
let testDatabase: TestDatabase | undefined;

afterEach(async () => {
  await app?.close();
  await testDatabase?.cleanup();
  app = undefined;
  testDatabase = undefined;
});

function createDatabaseConnection(database: TestDatabase): DatabaseConnection {
  return {
    client: database.client,
    db: database.db,
    collections: database.collections,
    close: () => database.client.close(),
  };
}

async function createAuthApp(env: Record<string, string | undefined> = {}) {
  testDatabase = await createTestDatabase();
  app = await createApp({
    env: {
      NODE_ENV: "test",
      COOKIE_SECRET: testCookieSecret,
      ...env,
    },
    logger: false,
    database: {
      connection: createDatabaseConnection(testDatabase),
      closeOnAppClose: false,
    },
  });

  return {
    app,
    database: testDatabase,
  };
}

function getSetCookieHeaders(response: ResponseWithHeaders) {
  const setCookie = response.headers["set-cookie"];

  if (Array.isArray(setCookie)) {
    return setCookie;
  }

  return typeof setCookie === "string" ? [setCookie] : [];
}

function mergeCookieHeader(currentCookieHeader: string, response: ResponseWithHeaders) {
  const cookies = new Map<string, string>();

  for (const cookie of currentCookieHeader.split(";")) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.length === 0) {
      continue;
    }

    const separatorIndex = trimmedCookie.indexOf("=");

    if (separatorIndex > 0) {
      cookies.set(trimmedCookie.slice(0, separatorIndex), trimmedCookie.slice(separatorIndex + 1));
    }
  }

  for (const setCookie of getSetCookieHeaders(response)) {
    const [cookiePair] = setCookie.split(";");

    if (!cookiePair) {
      continue;
    }

    const separatorIndex = cookiePair.indexOf("=");

    if (separatorIndex > 0) {
      cookies.set(cookiePair.slice(0, separatorIndex), cookiePair.slice(separatorIndex + 1));
    }
  }

  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function cookieHeaderFromResponse(response: ResponseWithHeaders) {
  return mergeCookieHeader("", response);
}

async function signUp(
  appInstance: FastifyInstance,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  return appInstance.inject({
    method: "POST",
    url: "/api/auth/signup",
    payload: {
      name: overrides.name ?? "Ada Lovelace",
      email: overrides.email ?? "ada@example.com",
      password: overrides.password ?? "correct horse battery staple",
    },
  });
}

async function getCsrfToken(appInstance: FastifyInstance, cookieHeader: string) {
  const response = await appInstance.inject({
    method: "GET",
    url: "/api/auth/csrf",
    headers: {
      cookie: cookieHeader,
    },
  });

  return response.json<{ csrfToken: string }>().csrfToken;
}

describe("auth routes", () => {
  it("signs up a user, sets host-prefixed cookies on Path=/, and returns the current user", async () => {
    const { app: appInstance } = await createAuthApp();

    const signupResponse = await signUp(appInstance, {
      email: "ada@example.com",
    });
    const setCookies = getSetCookieHeaders(signupResponse);
    const cookieHeader = cookieHeaderFromResponse(signupResponse);
    const csrfToken = await getCsrfToken(appInstance, cookieHeader);
    const meResponse = await appInstance.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: cookieHeader,
      },
    });

    const signupBody = signupResponse.json<{ user: Record<string, unknown> }>();

    expect(signupResponse.statusCode).toBe(201);
    expect(signupBody).toMatchObject({
      user: {
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
    });
    expect(signupBody.user).not.toHaveProperty("passwordHash");
    expect(setCookies.find((cookie) => cookie.startsWith(`${accessCookieName}=`))).toContain(
      "Path=/",
    );
    expect(setCookies.find((cookie) => cookie.startsWith(`${refreshCookieName}=`))).toContain(
      "Path=/",
    );
    expect(csrfToken).toEqual(expect.any(String));
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toMatchObject({
      user: {
        email: "ada@example.com",
      },
    });
  });

  it("rejects duplicate sign-up emails and invalid login credentials", async () => {
    const { app: appInstance } = await createAuthApp();

    await signUp(appInstance, {
      email: "Grace.Hopper@example.com",
      password: "valid password for grace",
    });

    const duplicateResponse = await signUp(appInstance, {
      email: " grace.hopper@example.com ",
      password: "another valid password",
    });
    const loginResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "grace.hopper@example.com",
        password: "incorrect password",
      },
    });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json()).toMatchObject({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
      },
    });
    expect(loginResponse.statusCode).toBe(401);
    expect(loginResponse.json()).toMatchObject({
      error: {
        code: "INVALID_CREDENTIALS",
      },
    });
  });

  it("rate limits repeated auth attempts from the same client and route", async () => {
    const { app: appInstance } = await createAuthApp({
      AUTH_RATE_LIMIT_MAX_ATTEMPTS: "2",
      AUTH_RATE_LIMIT_WINDOW_MS: "60000",
    });

    await signUp(appInstance, {
      email: "limited@example.com",
      password: "valid password for limited user",
    });

    const firstLoginResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "limited@example.com",
        password: "incorrect password",
      },
    });
    const secondLoginResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "limited@example.com",
        password: "incorrect password",
      },
    });
    const thirdLoginResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "limited@example.com",
        password: "incorrect password",
      },
    });

    expect(firstLoginResponse.statusCode).toBe(401);
    expect(secondLoginResponse.statusCode).toBe(401);
    expect(thirdLoginResponse.statusCode).toBe(429);
    expect(thirdLoginResponse.headers["retry-after"]).toBeDefined();
    expect(thirdLoginResponse.json()).toMatchObject({
      error: {
        code: "RATE_LIMITED",
      },
    });
  });

  it("logs in with valid credentials and scopes current-user context to the access cookie", async () => {
    const { app: appInstance } = await createAuthApp();

    const firstSignupResponse = await signUp(appInstance, {
      email: "first@example.com",
    });

    await signUp(appInstance, {
      email: "second@example.com",
      password: "second user password",
    });

    const loginResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: {
        "x-user-id": firstSignupResponse.json<{ user: { id: string } }>().user.id,
      },
      payload: {
        email: "second@example.com",
        password: "second user password",
      },
    });
    const meResponse = await appInstance.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: cookieHeaderFromResponse(loginResponse),
        "x-user-id": firstSignupResponse.json<{ user: { id: string } }>().user.id,
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toMatchObject({
      user: {
        email: "second@example.com",
      },
    });
  });

  it("rejects missing CSRF tokens on authenticated mutating routes and revokes refresh on logout", async () => {
    const { app: appInstance } = await createAuthApp();

    const signupResponse = await signUp(appInstance);
    const cookieHeader = cookieHeaderFromResponse(signupResponse);
    const csrfToken = await getCsrfToken(appInstance, cookieHeader);
    const missingCsrfResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: {
        cookie: cookieHeader,
      },
    });
    const logoutResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: {
        cookie: cookieHeader,
        "x-csrf-token": csrfToken,
      },
    });
    const refreshAfterLogoutResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: cookieHeader,
      },
    });

    expect(missingCsrfResponse.statusCode).toBe(403);
    expect(missingCsrfResponse.json()).toMatchObject({
      error: {
        code: "CSRF_TOKEN_INVALID",
      },
    });
    expect(logoutResponse.statusCode).toBe(204);
    expect(getSetCookieHeaders(logoutResponse)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(new RegExp(`^${accessCookieName}=;.*Path=/`)),
        expect.stringMatching(new RegExp(`^${refreshCookieName}=;.*Path=/`)),
      ]),
    );
    expect(refreshAfterLogoutResponse.statusCode).toBe(401);
    expect(refreshAfterLogoutResponse.json()).toMatchObject({
      error: {
        code: "REFRESH_TOKEN_REVOKED",
      },
    });
  });

  it("rejects missing, expired, and revoked refresh tokens", async () => {
    const { app: appInstance, database } = await createAuthApp();

    const signupResponse = await signUp(appInstance);
    const cookieHeader = cookieHeaderFromResponse(signupResponse);
    const missingResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
    });

    await database.collections.refreshTokens.updateOne(
      {},
      {
        $set: {
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        },
      },
    );

    const expiredResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: cookieHeader,
      },
    });

    await database.collections.refreshTokens.updateOne(
      {},
      {
        $set: {
          revokedAt: new Date("2026-04-26T00:00:00.000Z"),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      },
    );

    const revokedResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: cookieHeader,
      },
    });

    expect(missingResponse.statusCode).toBe(401);
    expect(missingResponse.json()).toMatchObject({
      error: {
        code: "REFRESH_TOKEN_MISSING",
      },
    });
    expect(expiredResponse.statusCode).toBe(401);
    expect(expiredResponse.json()).toMatchObject({
      error: {
        code: "REFRESH_TOKEN_EXPIRED",
      },
    });
    expect(revokedResponse.statusCode).toBe(401);
    expect(revokedResponse.json()).toMatchObject({
      error: {
        code: "REFRESH_TOKEN_REVOKED",
      },
    });
  });

  it("rotates refresh tokens and revokes the token family on stale-token replay", async () => {
    const { app: appInstance, database } = await createAuthApp();

    const signupResponse = await signUp(appInstance);
    const originalCookieHeader = cookieHeaderFromResponse(signupResponse);
    const firstRefreshResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: originalCookieHeader,
      },
    });
    const rotatedCookieHeader = mergeCookieHeader(originalCookieHeader, firstRefreshResponse);

    await database.collections.refreshTokens.updateOne(
      {
        replacedByTokenId: {
          $exists: true,
        },
      },
      {
        $set: {
          lastUsedAt: new Date("2026-04-25T00:00:00.000Z"),
        },
      },
    );

    const replayResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: originalCookieHeader,
      },
    });
    const rotatedRefreshAfterReplayResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: rotatedCookieHeader,
      },
    });

    expect(firstRefreshResponse.statusCode).toBe(200);
    expect(firstRefreshResponse.headers["set-cookie"]).toBeDefined();
    expect(replayResponse.statusCode).toBe(401);
    expect(replayResponse.json()).toMatchObject({
      error: {
        code: "REFRESH_REPLAY_DETECTED",
      },
    });
    expect(rotatedRefreshAfterReplayResponse.statusCode).toBe(401);
    expect(rotatedRefreshAfterReplayResponse.json()).toMatchObject({
      error: {
        code: "REFRESH_TOKEN_REVOKED",
      },
    });
  });

  it("handles concurrent refresh with one rotation and leaves the winning token family usable", async () => {
    const { app: appInstance } = await createAuthApp();

    const signupResponse = await signUp(appInstance);
    const cookieHeader = cookieHeaderFromResponse(signupResponse);
    const [firstResponse, secondResponse] = await Promise.all([
      appInstance.inject({
        method: "POST",
        url: "/api/auth/refresh",
        headers: {
          cookie: cookieHeader,
        },
      }),
      appInstance.inject({
        method: "POST",
        url: "/api/auth/refresh",
        headers: {
          cookie: cookieHeader,
        },
      }),
    ]);
    const responses = [firstResponse, secondResponse];
    const successfulRefresh = responses.find((response) => response.statusCode === 200);
    const retryRaceResponse = responses.find((response) => response.statusCode === 409);

    if (!successfulRefresh) {
      throw new Error("Expected one concurrent refresh request to succeed.");
    }

    const nextRefreshResponse = await appInstance.inject({
      method: "POST",
      url: "/api/auth/refresh",
      headers: {
        cookie: mergeCookieHeader(cookieHeader, successfulRefresh),
      },
    });

    expect(responses.map((response) => response.statusCode).sort()).toEqual([200, 409]);
    expect(retryRaceResponse?.json()).toMatchObject({
      error: {
        code: "REFRESH_TOKEN_ALREADY_ROTATED",
      },
    });
    expect(nextRefreshResponse.statusCode).toBe(200);
  });

  it("rejects malformed access cookies before user-scoped routes are reached", async () => {
    const { app: appInstance } = await createAuthApp();

    const response = await appInstance.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: `${accessCookieName}=not-a-valid-token`,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "ACCESS_TOKEN_INVALID",
      },
    });
  });

  it("rejects users deleted after access-token issuance", async () => {
    const { app: appInstance, database } = await createAuthApp();

    const signupResponse = await signUp(appInstance, {
      email: "deleted-user@example.com",
    });
    const cookieHeader = cookieHeaderFromResponse(signupResponse);
    const userId = signupResponse.json<{ user: { id: string } }>().user.id;

    await database.collections.users.deleteOne({
      _id: new ObjectId(userId),
    });

    const response = await appInstance.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        cookie: cookieHeader,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "ACCESS_TOKEN_USER_NOT_FOUND",
      },
    });
  });
});
