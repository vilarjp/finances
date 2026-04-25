import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { collectionNames } from "./db/index.js";
import { getTestMongoUri } from "./test/mongodb-memory.js";

describe("createApp database lifecycle", () => {
  it("connects to MongoDB and ensures indexes during app startup", async () => {
    const app = await createApp({
      env: {
        NODE_ENV: "test",
        MONGODB_URI: await getTestMongoUri(),
      },
      logger: false,
    });
    const financeDb = app.financeDb;

    if (!financeDb) {
      throw new Error("Expected the app to decorate a database connection.");
    }

    const indexes = await financeDb.db.collection(collectionNames.users).indexes();

    await app.close();

    expect(indexes.map((index) => index.name)).toEqual(
      expect.arrayContaining(["_id_", "users_normalized_email_unique"]),
    );
    await expect(financeDb.client.db().command({ ping: 1 })).rejects.toThrow();
  });
});
