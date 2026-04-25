import "dotenv/config";

import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";

const config = parseEnv();
const app = await createApp({ env: process.env });

async function shutdown(signal: NodeJS.Signals) {
  app.log.info({ signal }, "Shutting down backend server");
  await app.close();
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await app.listen({
    host: config.host,
    port: config.port,
  });
} catch (error) {
  app.log.error({ err: error }, "Failed to start backend server");
  process.exit(1);
}
