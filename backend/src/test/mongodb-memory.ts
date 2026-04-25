import { randomUUID } from "node:crypto";

import { MongoClient, type Db } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import {
  ensureDatabaseIndexes,
  getFinanceCollections,
  type FinanceCollections,
} from "../db/index.js";

let replSetStart: Promise<MongoMemoryReplSet> | undefined;

export async function startTestMongoReplicaSet() {
  replSetStart ??= MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  }).catch((error: unknown) => {
    replSetStart = undefined;

    throw error;
  });

  const startedReplSet = await replSetStart;

  return {
    replSet: startedReplSet,
    uri: startedReplSet.getUri(),
  };
}

export type TestDatabase = {
  client: MongoClient;
  db: Db;
  collections: FinanceCollections;
  databaseName: string;
  uri: string;
  cleanup: () => Promise<void>;
};

export function createTestDatabaseName() {
  return `finances_test_${randomUUID().replaceAll("-", "")}`;
}

export async function getTestMongoUri(databaseName = createTestDatabaseName()) {
  const { replSet: startedReplSet } = await startTestMongoReplicaSet();

  return startedReplSet.getUri(databaseName);
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const databaseName = createTestDatabaseName();
  const uri = await getTestMongoUri(databaseName);
  const client = new MongoClient(uri, {
    appName: "personal-finance-backend-test",
  });

  await client.connect();

  const db = client.db(databaseName);

  await ensureDatabaseIndexes(db);

  return {
    client,
    db,
    collections: getFinanceCollections(db),
    databaseName,
    uri,
    cleanup: async () => {
      await db.dropDatabase();
      await client.close();
    },
  };
}

export async function stopTestMongoReplicaSet() {
  await replSetStart?.then((startedReplSet) => startedReplSet.stop());
  replSetStart = undefined;
}
