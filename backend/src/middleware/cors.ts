import type { FastifyInstance, FastifyRequest } from "fastify";

import type { AppConfig } from "../config/env.js";
import { forbiddenError } from "../shared/errors.js";

const allowedMethods = "GET,POST,PATCH,DELETE,OPTIONS";
const allowedHeaders = "Accept,Content-Type,X-CSRF-Token,X-Request-ID";
const exposedHeaders = "X-Request-ID";

function getOrigin(request: FastifyRequest): string | undefined {
  const { origin } = request.headers as { origin?: unknown };

  if (Array.isArray(origin)) {
    const firstOrigin: unknown = origin[0];

    return typeof firstOrigin === "string" ? firstOrigin : undefined;
  }

  return typeof origin === "string" ? origin : undefined;
}

export function registerCorsMiddleware(
  app: FastifyInstance,
  config: Pick<AppConfig, "frontendOrigins">,
) {
  const allowedOrigins = new Set(config.frontendOrigins);

  app.addHook("onRequest", async (request, reply) => {
    const origin = getOrigin(request);

    if (!origin) {
      return;
    }

    if (!allowedOrigins.has(origin)) {
      throw forbiddenError("CORS origin is not allowed.");
    }

    reply
      .header("Access-Control-Allow-Origin", origin)
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Expose-Headers", exposedHeaders)
      .header("Vary", "Origin");

    if (request.method === "OPTIONS") {
      return reply
        .header("Access-Control-Allow-Methods", allowedMethods)
        .header("Access-Control-Allow-Headers", allowedHeaders)
        .status(204)
        .send();
    }
  });
}
