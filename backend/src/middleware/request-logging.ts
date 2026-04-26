import type { FastifyInstance, FastifyRequest } from "fastify";

import type { AppLogger } from "../shared/logger.js";

const requestStartedAt = new WeakMap<FastifyRequest, number>();

function getRequestPath(request: FastifyRequest) {
  const routePath = request.routeOptions.url;

  if (routePath) {
    return routePath;
  }

  return new URL(request.url, "http://localhost").pathname;
}

export function registerRequestLogging(app: FastifyInstance, logger: AppLogger) {
  app.addHook("onRequest", (request, _reply, done) => {
    requestStartedAt.set(request, Date.now());
    done();
  });

  app.addHook("onResponse", (request, reply, done) => {
    const startedAt = requestStartedAt.get(request) ?? Date.now();
    const durationMs = Date.now() - startedAt;

    logger.info("request.completed", {
      durationMs,
      method: request.method,
      path: getRequestPath(request),
      requestId: request.id,
      statusCode: reply.statusCode,
      ...(request.user
        ? {
            userId: request.user.userId.toHexString(),
          }
        : {}),
    });
    done();
  });
}
