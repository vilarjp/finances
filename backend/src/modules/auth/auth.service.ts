import { hash, verify } from "@node-rs/argon2";

import type { AppConfig } from "../../config/env.js";
import type { DatabaseConnection, RefreshTokenDocument, UserDocument } from "../../db/index.js";
import { HttpError } from "../../shared/errors.js";
import { authDurations } from "./auth.constants.js";
import {
  AuthRepository,
  isDuplicateKeyError,
  type CreateRefreshTokenInput,
} from "./auth.repository.js";
import {
  type LoginInput,
  normalizeEmail,
  type SafeUser,
  type SignupInput,
  toSafeUser,
} from "./auth.schemas.js";
import {
  createCsrfToken,
  createRandomToken,
  hashRefreshToken,
  issueAccessToken,
  type AccessTokenPayload,
  verifyAccessToken,
  verifyCsrfToken,
} from "./auth.tokens.js";

export type AuthenticatedUserContext = {
  id: string;
  userId: UserDocument["_id"];
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  accessToken: AccessTokenPayload;
};

export type AuthSession = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
};

function authError(statusCode: number, code: string, message: string) {
  return new HttpError({
    code,
    message,
    statusCode,
  });
}

function getRefreshExpiry(now: Date) {
  return new Date(now.getTime() + authDurations.refreshTokenSeconds * 1000);
}

function isTokenExpired(token: RefreshTokenDocument, now: Date) {
  return token.expiresAt.getTime() <= now.getTime();
}

function isRecentRefreshRace(token: RefreshTokenDocument, now: Date) {
  if (!token.replacedByTokenId || !token.lastUsedAt) {
    return false;
  }

  return now.getTime() - token.lastUsedAt.getTime() <= authDurations.concurrentRefreshGraceMs;
}

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(
    connection: DatabaseConnection,
    private readonly config: AppConfig,
  ) {
    this.repository = new AuthRepository(connection);
  }

  async signUp(input: SignupInput, now = new Date()) {
    const normalizedEmail = normalizeEmail(input.email);
    const existingUser = await this.repository.findUserByNormalizedEmail(normalizedEmail);

    if (existingUser) {
      throw authError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered.");
    }

    try {
      const user = await this.repository.createUser({
        name: input.name.trim(),
        email: input.email.trim(),
        normalizedEmail,
        passwordHash: await hash(input.password),
        now,
      });

      return this.issueSession(user, now);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw authError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered.");
      }

      throw error;
    }
  }

  async login(input: LoginInput, now = new Date()) {
    const user = await this.repository.findUserByNormalizedEmail(normalizeEmail(input.email));

    if (!user) {
      throw authError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    const passwordMatches = await verify(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw authError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    return this.issueSession(user, now);
  }

  async refresh(refreshToken: string, now = new Date()) {
    const replacementRawToken = createRandomToken();
    const rotatedToken = await this.repository.rotateRefreshToken({
      tokenHash: hashRefreshToken(refreshToken, this.config.cookieSecret),
      replacementToken: this.createRefreshTokenInput(replacementRawToken, now),
      now,
    });

    if (!rotatedToken) {
      await this.handleInactiveRefreshToken(refreshToken, now);
    }

    if (!rotatedToken) {
      throw authError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid.");
    }

    const user = await this.repository.findUserById(rotatedToken.consumedToken.userId);

    if (!user) {
      await this.repository.revokeRefreshTokenFamily({
        familyId: rotatedToken.consumedToken.familyId,
        now,
      });

      throw authError(401, "REFRESH_TOKEN_USER_NOT_FOUND", "Refresh token user was not found.");
    }

    return this.issueSessionFromExistingRefresh(user, replacementRawToken, now);
  }

  async logout(refreshToken: string | undefined, now = new Date()) {
    if (!refreshToken) {
      return;
    }

    const storedToken = await this.repository.findRefreshTokenByHash(
      hashRefreshToken(refreshToken, this.config.cookieSecret),
    );

    if (!storedToken) {
      return;
    }

    await this.repository.revokeRefreshTokenFamily({
      familyId: storedToken.familyId,
      now,
    });
  }

  async authenticateAccessToken(accessToken: string, now = new Date()) {
    const verifiedToken = verifyAccessToken(accessToken, this.config.cookieSecret, now);
    const user = await this.repository.findUserById(verifiedToken.userId);

    if (!user) {
      throw authError(401, "ACCESS_TOKEN_USER_NOT_FOUND", "Access token user was not found.");
    }

    return {
      id: user._id.toHexString(),
      userId: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      accessToken: verifiedToken.payload,
    } satisfies AuthenticatedUserContext;
  }

  createCsrfToken(user: AuthenticatedUserContext) {
    return createCsrfToken(user.accessToken, this.config.cookieSecret);
  }

  verifyCsrfToken(csrfToken: string, user: AuthenticatedUserContext) {
    verifyCsrfToken(csrfToken, user.accessToken, this.config.cookieSecret);
  }

  private createRefreshTokenInput(
    rawRefreshToken: string,
    now: Date,
  ): Omit<CreateRefreshTokenInput, "userId" | "familyId"> {
    return {
      tokenHash: hashRefreshToken(rawRefreshToken, this.config.cookieSecret),
      expiresAt: getRefreshExpiry(now),
      now,
    };
  }

  private async issueSession(user: UserDocument, now: Date): Promise<AuthSession> {
    const refreshToken = createRandomToken();

    await this.repository.createRefreshToken({
      ...this.createRefreshTokenInput(refreshToken, now),
      userId: user._id,
      familyId: createRandomToken(16),
    });

    return this.issueSessionFromExistingRefresh(user, refreshToken, now);
  }

  private issueSessionFromExistingRefresh(
    user: UserDocument,
    refreshToken: string,
    now: Date,
  ): AuthSession {
    return {
      user: toSafeUser(user),
      accessToken: issueAccessToken(user._id, this.config.cookieSecret, now).token,
      refreshToken,
    };
  }

  private async handleInactiveRefreshToken(refreshToken: string, now: Date) {
    const storedToken = await this.repository.findRefreshTokenByHash(
      hashRefreshToken(refreshToken, this.config.cookieSecret),
    );

    if (!storedToken) {
      throw authError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid.");
    }

    if (isTokenExpired(storedToken, now)) {
      throw authError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired.");
    }

    if (storedToken.revokedAt) {
      throw authError(401, "REFRESH_TOKEN_REVOKED", "Refresh token has been revoked.");
    }

    if (isRecentRefreshRace(storedToken, now)) {
      throw authError(
        409,
        "REFRESH_TOKEN_ALREADY_ROTATED",
        "Refresh token was already rotated by a concurrent request.",
      );
    }

    if (storedToken.replacedByTokenId) {
      await this.repository.revokeRefreshTokenFamily({
        familyId: storedToken.familyId,
        now,
        reuseDetected: true,
      });

      throw authError(401, "REFRESH_REPLAY_DETECTED", "Refresh token replay was detected.");
    }

    throw authError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid.");
  }
}
