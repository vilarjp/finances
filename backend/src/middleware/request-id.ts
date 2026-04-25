import { randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyServerOptions } from "fastify";

export const requestIdHeader = "x-request-id";

export function normalizeRequestId(value: string | string[] | undefined) {
  const requestId = Array.isArray(value) ? value[0] : value;
  const trimmedRequestId = requestId?.trim();

  if (!trimmedRequestId || trimmedRequestId.length > 200) {
    return undefined;
  }

  return trimmedRequestId;
}

export function createRequestIdGenerator(): NonNullable<FastifyServerOptions["genReqId"]> {
  return (request) => normalizeRequestId(request.headers[requestIdHeader]) ?? randomUUID();
}

export function requestIdMiddleware(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    reply.header(requestIdHeader, request.id);
  });
}
