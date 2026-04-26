import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { ObjectId } from "mongodb";
import { z } from "zod";

import { HttpError } from "../../shared/errors.js";
import { authDurations } from "./auth.constants.js";

const accessTokenPayloadSchema = z.object({
  sub: z.string(),
  exp: z.number().int(),
  iat: z.number().int(),
  csrf: z.string().min(32),
});

const csrfTokenPayloadSchema = z.object({
  sub: z.string(),
  exp: z.number().int(),
  csrf: z.string().min(32),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export type IssuedAccessToken = {
  token: string;
  payload: AccessTokenPayload;
  expiresAt: Date;
};

function authError(statusCode: number, code: string, message: string) {
  return new HttpError({
    code,
    message,
    statusCode,
  });
}

export function createRandomToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function hashRefreshToken(refreshToken: string, secret: string) {
  return createHmac("sha256", secret).update(refreshToken).digest("hex");
}

function getEpochSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function createSignedToken(payload: object, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function parseSignedPayload(token: string, secret: string) {
  const tokenParts = token.split(".");
  const [encodedPayload, signature] = tokenParts;

  if (tokenParts.length !== 2 || !encodedPayload || !signature) {
    throw authError(401, "ACCESS_TOKEN_INVALID", "Access token is invalid.");
  }

  if (!signaturesMatch(signature, signValue(encodedPayload, secret))) {
    throw authError(401, "ACCESS_TOKEN_INVALID", "Access token is invalid.");
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as unknown;
  } catch {
    throw authError(401, "ACCESS_TOKEN_INVALID", "Access token is invalid.");
  }
}

function parseObjectId(id: string, errorCode: string) {
  if (!/^[a-f\d]{24}$/i.test(id) || !ObjectId.isValid(id)) {
    throw authError(401, errorCode, "Token subject is invalid.");
  }

  return new ObjectId(id);
}

export function issueAccessToken(userId: ObjectId, secret: string, now = new Date()) {
  const issuedAt = getEpochSeconds(now);
  const expiresAt = new Date(now.getTime() + authDurations.accessTokenSeconds * 1000);
  const payload: AccessTokenPayload = {
    sub: userId.toHexString(),
    iat: issuedAt,
    exp: getEpochSeconds(expiresAt),
    csrf: createRandomToken(),
  };

  return {
    token: createSignedToken(payload, secret),
    payload,
    expiresAt,
  } satisfies IssuedAccessToken;
}

export function verifyAccessToken(token: string, secret: string, now = new Date()) {
  const parsed = accessTokenPayloadSchema.safeParse(parseSignedPayload(token, secret));

  if (!parsed.success) {
    throw authError(401, "ACCESS_TOKEN_INVALID", "Access token is invalid.");
  }

  if (parsed.data.exp <= getEpochSeconds(now)) {
    throw authError(401, "ACCESS_TOKEN_EXPIRED", "Access token has expired.");
  }

  return {
    payload: parsed.data,
    userId: parseObjectId(parsed.data.sub, "ACCESS_TOKEN_INVALID"),
    expiresAt: new Date(parsed.data.exp * 1000),
  };
}

export function createCsrfToken(accessToken: AccessTokenPayload, secret: string) {
  return createSignedToken(
    {
      sub: accessToken.sub,
      exp: accessToken.exp,
      csrf: accessToken.csrf,
    },
    secret,
  );
}

export function verifyCsrfToken(
  csrfToken: string,
  accessToken: AccessTokenPayload,
  secret: string,
  now = new Date(),
) {
  let parsedPayload: unknown;

  try {
    parsedPayload = parseSignedPayload(csrfToken, secret);
  } catch {
    throw authError(403, "CSRF_TOKEN_INVALID", "CSRF token is invalid.");
  }

  const parsed = csrfTokenPayloadSchema.safeParse(parsedPayload);

  if (
    !parsed.success ||
    parsed.data.sub !== accessToken.sub ||
    parsed.data.csrf !== accessToken.csrf ||
    parsed.data.exp !== accessToken.exp ||
    parsed.data.exp <= getEpochSeconds(now)
  ) {
    throw authError(403, "CSRF_TOKEN_INVALID", "CSRF token is invalid.");
  }
}
