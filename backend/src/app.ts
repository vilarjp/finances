import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";

import { parseEnv } from "./config/env.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { createRequestIdGenerator, requestIdMiddleware } from "./middleware/request-id.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { createLoggerOptions } from "./shared/logger.js";

export type CreateAppOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  logger?: NonNullable<FastifyServerOptions["logger"]>;
};

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const config = parseEnv(options.env);
  const logger = options.logger ?? createLoggerOptions(config);
  const app = fastify({
    bodyLimit: 256 * 1024,
    genReqId: createRequestIdGenerator(),
    logger,
  });

  await app.register(helmet);
  await app.register(cookie, config.cookieSecret ? { secret: config.cookieSecret } : {});
  requestIdMiddleware(app);

  registerErrorHandler(app);

  await app.register(healthRoutes, { config });

  return app;
}
