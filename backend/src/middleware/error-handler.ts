import type { FastifyInstance } from "fastify";

import { mapErrorToHttpResponse } from "../shared/errors.js";
import type { AppLogger } from "../shared/logger.js";

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

export function registerErrorHandler(app: FastifyInstance, logger: AppLogger) {
  app.setErrorHandler((error, request, reply) => {
    const mappedError = mapErrorToHttpResponse(error, {
      requestId: request.id,
    });
    const logContext = {
      errorCode: mappedError.body.error.code,
      errorName: getErrorName(error),
      method: request.method,
      path: request.routeOptions.url ?? new URL(request.url, "http://localhost").pathname,
      requestId: request.id,
      statusCode: mappedError.statusCode,
      ...(request.user
        ? {
            userId: request.user.userId.toHexString(),
          }
        : {}),
    };

    if (mappedError.statusCode >= 500) {
      logger.error("request.unhandled_error", logContext);
    } else {
      logger.warn("request.handled_error", logContext);
    }

    return reply.status(mappedError.statusCode).send(mappedError.body);
  });
}
