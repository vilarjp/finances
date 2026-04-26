import type { FastifyInstance } from "fastify";

import { mapErrorToHttpResponse } from "../shared/errors.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    const mappedError = mapErrorToHttpResponse(error, {
      requestId: request.id,
    });

    if (mappedError.statusCode >= 500) {
      request.log.error({ err: error, requestId: request.id }, "Unhandled request error");
    } else {
      request.log.warn({ err: error, requestId: request.id }, "Handled request error");
    }

    return reply.status(mappedError.statusCode).send(mappedError.body);
  });
}
