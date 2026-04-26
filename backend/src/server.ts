import "dotenv/config";

import { createApp } from "./app.js";
import { parseEnv } from "./config/env.js";

const config = parseEnv();
const app = await createApp({ env: process.env });

async function shutdown(signal: NodeJS.Signals) {
  app.financeLogger.info("server.shutdown", { signal });
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
  app.financeLogger.info("server.started", {
    host: config.host,
    port: config.port,
  });
} catch (error) {
  app.financeLogger.error("server.start_failed", { error });
  process.exit(1);
}
