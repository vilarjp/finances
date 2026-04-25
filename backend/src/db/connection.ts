import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

import { getFinanceCollections, type FinanceCollections } from "./collections.js";
import { ensureDatabaseIndexes } from "./indexes.js";

export type DatabaseConnection = {
  client: MongoClient;
  db: Db;
  collections: FinanceCollections;
  close: () => Promise<void>;
};

export type ConnectDatabaseOptions = {
  uri: string;
  clientOptions?: MongoClientOptions;
  ensureIndexes?: boolean;
};

export async function connectToDatabase({
  uri,
  clientOptions,
  ensureIndexes = true,
}: ConnectDatabaseOptions): Promise<DatabaseConnection> {
  const client = new MongoClient(uri, {
    appName: "personal-finance-backend",
    ...clientOptions,
  });

  await client.connect();

  const db = client.db();

  if (ensureIndexes) {
    await ensureDatabaseIndexes(db);
  }

  return {
    client,
    db,
    collections: getFinanceCollections(db),
    close: () => client.close(),
  };
}
