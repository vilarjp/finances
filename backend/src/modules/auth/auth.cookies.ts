import type { FastifyReply, FastifyRequest } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { HttpError } from "../../shared/errors.js";
import { authCookieNames, authDurations } from "./auth.constants.js";

type AuthCookieName = (typeof authCookieNames)[keyof typeof authCookieNames];

function createCookieOptions(config: AppConfig, maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: config.nodeEnv === "production",
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
  reply
    .setCookie(
      authCookieNames.access,
      cookies.accessToken,
      createCookieOptions(config, authDurations.accessTokenSeconds),
    )
    .setCookie(
      authCookieNames.refresh,
      cookies.refreshToken,
      createCookieOptions(config, authDurations.refreshTokenSeconds),
    );
}

export function clearAuthCookies(reply: FastifyReply, config: AppConfig) {
  reply
    .clearCookie(
      authCookieNames.access,
      createCookieOptions(config, authDurations.accessTokenSeconds),
    )
    .clearCookie(
      authCookieNames.refresh,
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
