import type { FastifyReply, FastifyRequest } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { HttpError } from "../../shared/errors.js";
import { authDurations } from "./auth.constants.js";

const secureAuthCookieNames = {
  access: "__Host-finance_access",
  refresh: "__Host-finance_refresh",
} as const;

const localAuthCookieNames = {
  access: "finance_access",
  refresh: "finance_refresh",
} as const;

export type AuthCookieName =
  | (typeof secureAuthCookieNames)[keyof typeof secureAuthCookieNames]
  | (typeof localAuthCookieNames)[keyof typeof localAuthCookieNames];

function shouldUseSecureCookies(config: AppConfig) {
  return config.nodeEnv === "production";
}

export function getAuthCookieNames(config: AppConfig) {
  return shouldUseSecureCookies(config) ? secureAuthCookieNames : localAuthCookieNames;
}

function createCookieOptions(config: AppConfig, maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(config),
    signed: true,
  };
}

export type AuthSessionCookies = {
  accessToken: string;
  refreshToken: string;
};

export function setAuthCookies(
  reply: FastifyReply,
  config: AppConfig,
  cookies: AuthSessionCookies,
) {
  const cookieNames = getAuthCookieNames(config);

  reply
    .setCookie(
      cookieNames.access,
      cookies.accessToken,
      createCookieOptions(config, authDurations.accessTokenSeconds),
    )
    .setCookie(
      cookieNames.refresh,
      cookies.refreshToken,
      createCookieOptions(config, authDurations.refreshTokenSeconds),
    );
}

export function clearAuthCookies(reply: FastifyReply, config: AppConfig) {
  const cookieNames = getAuthCookieNames(config);

  reply
    .clearCookie(cookieNames.access, createCookieOptions(config, authDurations.accessTokenSeconds))
    .clearCookie(
      cookieNames.refresh,
      createCookieOptions(config, authDurations.refreshTokenSeconds),
    );
}

export function readSignedCookie(
  request: FastifyRequest,
  cookieName: AuthCookieName,
  missingErrorCode: string,
  invalidErrorCode: string,
) {
  const signedCookie = request.cookies[cookieName];

  if (!signedCookie) {
    throw new HttpError({
      code: missingErrorCode,
      message: "Authentication cookie is missing.",
      statusCode: 401,
    });
  }

  const unsignedCookie = request.unsignCookie(signedCookie);

  if (!unsignedCookie.valid) {
    throw new HttpError({
      code: invalidErrorCode,
      message: "Authentication cookie is invalid.",
      statusCode: 401,
    });
  }

  return unsignedCookie.value;
}

export function readOptionalSignedCookie(request: FastifyRequest, cookieName: AuthCookieName) {
  const signedCookie = request.cookies[cookieName];

  if (!signedCookie) {
    return undefined;
  }

  const unsignedCookie = request.unsignCookie(signedCookie);

  return unsignedCookie.valid ? unsignedCookie.value : undefined;
}
