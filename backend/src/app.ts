import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";

import { parseEnv } from "./config/env.js";
import { connectToDatabase, ensureDatabaseIndexes, type DatabaseConnection } from "./db/index.js";
import { registerCorsMiddleware } from "./middleware/cors.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { registerRequestLogging } from "./middleware/request-logging.js";
import { createRequestIdGenerator, requestIdMiddleware } from "./middleware/request-id.js";
import { registerAuthMiddleware } from "./modules/auth/auth.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { recurringTagsRoutes } from "./modules/recurring-tags/recurring-tags.routes.js";
import { recordsRoutes } from "./modules/records/records.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { createConsoleLogger, type AppLogger } from "./shared/logger.js";

declare module "fastify" {
  interface FastifyInstance {
    financeDb?: DatabaseConnection;
    financeLogger: AppLogger;
  }
}

export type CreateAppDatabaseOption =
  | false
  | {
      connection: DatabaseConnection;
      closeOnAppClose?: boolean;
    };

export type CreateAppOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  logger?: NonNullable<FastifyServerOptions["logger"]>;
  appLogger?: AppLogger;
  database?: CreateAppDatabaseOption;
};

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const config = parseEnv(options.env);
  const logger = options.logger ?? false;
  const appLogger = options.appLogger ?? createConsoleLogger(config);
  const app = fastify({
    bodyLimit: 256 * 1024,
    genReqId: createRequestIdGenerator(),
    logger,
  });

  app.decorate("financeLogger", appLogger);
  await app.register(helmet);
  await app.register(cookie, { secret: config.cookieSecret });
  requestIdMiddleware(app);
  registerCorsMiddleware(app, config);
  registerRequestLogging(app, appLogger);

  registerErrorHandler(app, appLogger);

  const databaseOption = options.database;

  if (databaseOption !== false) {
    const financeDb =
      databaseOption && "connection" in databaseOption
        ? databaseOption.connection
        : await connectToDatabase({
            uri: config.mongodbUri,
          });
    const closeOnAppClose =
      databaseOption && "connection" in databaseOption
        ? (databaseOption.closeOnAppClose ?? false)
        : true;

    if (databaseOption && "connection" in databaseOption) {
      await ensureDatabaseIndexes(financeDb.db);
    }

    app.decorate("financeDb", financeDb);
    const authService = new AuthService(financeDb, config);

    registerAuthMiddleware(app, authService);
    app.addHook("onClose", async () => {
      if (closeOnAppClose) {
        await financeDb.close();
      }
    });

    await app.register(authRoutes, {
      prefix: "/api/auth",
      authService,
      config,
    });
    await app.register(categoriesRoutes, {
      prefix: "/api/categories",
    });
    await app.register(recurringTagsRoutes, {
      prefix: "/api/recurring-tags",
    });
    await app.register(recordsRoutes, {
      prefix: "/api/records",
    });
    await app.register(reportsRoutes, {
      prefix: "/api/reports",
    });
  }

  await app.register(healthRoutes, { config });

  return app;
}
