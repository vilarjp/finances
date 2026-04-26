import { MongoServerError, ObjectId, type ClientSession } from "mongodb";

import type { DatabaseConnection, RefreshTokenDocument, UserDocument } from "../../db/index.js";

export type CreateUserDocumentInput = {
  name: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  now: Date;
};

export type CreateRefreshTokenInput = {
  _id?: ObjectId;
  userId: ObjectId;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
};

export type RotatedRefreshToken = {
  consumedToken: RefreshTokenDocument;
  replacementToken: RefreshTokenDocument;
};

function createRefreshTokenDocument(input: CreateRefreshTokenInput): RefreshTokenDocument {
  return {
    _id: input._id ?? new ObjectId(),
    userId: input.userId,
    familyId: input.familyId,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
    createdAt: input.now,
  };
}

export function isDuplicateKeyError(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000;
}

export class AuthRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async createUser(input: CreateUserDocumentInput) {
    const document: UserDocument = {
      _id: new ObjectId(),
      name: input.name,
      email: input.email,
      normalizedEmail: input.normalizedEmail,
      passwordHash: input.passwordHash,
      createdAt: input.now,
      updatedAt: input.now,
    };

    await this.connection.collections.users.insertOne(document);

    return document;
  }

  async findUserByNormalizedEmail(normalizedEmail: string) {
    return this.connection.collections.users.findOne({
      normalizedEmail,
    });
  }

  async findUserById(userId: ObjectId) {
    return this.connection.collections.users.findOne({
      _id: userId,
    });
  }

  async createRefreshToken(input: CreateRefreshTokenInput) {
    const document = createRefreshTokenDocument(input);

    await this.connection.collections.refreshTokens.insertOne(document);

    return document;
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return this.connection.collections.refreshTokens.findOne({
      tokenHash,
    });
  }

  async rotateRefreshToken(input: {
    tokenHash: string;
    replacementToken: Omit<CreateRefreshTokenInput, "userId" | "familyId">;
    now: Date;
  }): Promise<RotatedRefreshToken | null> {
    const replacementTokenId = input.replacementToken._id ?? new ObjectId();
    let replacementToken: RefreshTokenDocument | null = null;
    let consumedToken: RefreshTokenDocument | null = null;
    const session = this.connection.client.startSession();

    try {
      await session.withTransaction(async () => {
        consumedToken = await this.connection.collections.refreshTokens.findOneAndUpdate(
          {
            tokenHash: input.tokenHash,
            expiresAt: {
              $gt: input.now,
            },
            revokedAt: {
              $exists: false,
            },
            replacedByTokenId: {
              $exists: false,
            },
          },
          {
            $set: {
              lastUsedAt: input.now,
              replacedByTokenId: replacementTokenId,
            },
          },
          {
            returnDocument: "before",
            session,
          },
        );

        if (!consumedToken) {
          return;
        }

        replacementToken = createRefreshTokenDocument({
          ...input.replacementToken,
          _id: replacementTokenId,
          userId: consumedToken.userId,
          familyId: consumedToken.familyId,
        });

        await this.connection.collections.refreshTokens.insertOne(replacementToken, {
          session,
        });
      });
    } finally {
      await session.endSession();
    }

    if (!consumedToken || !replacementToken) {
      return null;
    }

    return {
      consumedToken,
      replacementToken,
    };
  }

  async revokeRefreshTokenFamily(input: {
    familyId: string;
    now: Date;
    reuseDetected?: boolean;
    session?: ClientSession;
  }) {
    const update = {
      $set: {
        revokedAt: input.now,
        ...(input.reuseDetected ? { reuseDetectedAt: input.now } : {}),
      },
    };

    if (input.session) {
      await this.connection.collections.refreshTokens.updateMany(
        {
          familyId: input.familyId,
        },
        update,
        {
          session: input.session,
        },
      );

      return;
    }

    await this.connection.collections.refreshTokens.updateMany(
      {
        familyId: input.familyId,
      },
      update,
    );
  }
}
