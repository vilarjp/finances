import { createApp } from "../app.js";
import type { DatabaseConnection } from "../db/index.js";
import {
  createTestDatabase,
  stopTestMongoReplicaSet,
  type TestDatabase,
} from "./mongodb-memory.js";

const host = "127.0.0.1";
const port = Number.parseInt(process.env.FINANCES_E2E_API_PORT ?? "3100", 10);
const frontendOrigin = process.env.FINANCES_E2E_FRONTEND_ORIGIN ?? "http://127.0.0.1:4174";
const cookieSecret = "e2e-cookie-secret-that-is-long-enough-for-tests";

function createDatabaseConnection(database: TestDatabase): DatabaseConnection {
  return {
    client: database.client,
    db: database.db,
    collections: database.collections,
    close: () => database.client.close(),
  };
}

const database = await createTestDatabase();
const app = await createApp({
  env: {
    NODE_ENV: "test",
    COOKIE_SECRET: cookieSecret,
    FRONTEND_ORIGINS: frontendOrigin,
  },
  logger: false,
  database: {
    connection: createDatabaseConnection(database),
    closeOnAppClose: false,
  },
});

let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  await app.close();
  await database.cleanup();
  await stopTestMongoReplicaSet();
}

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});
process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

await app.listen({ host, port });

app.financeLogger.info("e2e_server.started", {
  frontendOrigin,
  host,
  port,
});
