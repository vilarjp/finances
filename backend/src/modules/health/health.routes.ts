import type { FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/env.js";

type HealthRouteOptions = {
  config: Pick<AppConfig, "nodeEnv">;
};

export const healthRoutes: FastifyPluginCallback<HealthRouteOptions> = (app, options, done) => {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            required: ["status", "service", "environment", "uptimeSeconds", "timestamp"],
            properties: {
              status: { type: "string" },
              service: { type: "string" },
              environment: { type: "string" },
              uptimeSeconds: { type: "number" },
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
    () => ({
      status: "ok",
      service: "personal-finance-backend",
      environment: options.config.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );

  done();
};
