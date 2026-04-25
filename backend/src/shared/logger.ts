import type { FastifyServerOptions } from "fastify";

import type { AppConfig } from "../config/env.js";

export function createLoggerOptions(
  config: Pick<AppConfig, "logLevel" | "nodeEnv">,
): NonNullable<FastifyServerOptions["logger"]> {
  if (config.nodeEnv === "test") {
    return false;
  }

  return {
    level: config.logLevel,
    redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"],
    ...(config.nodeEnv === "development"
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              ignore: "pid,hostname",
              singleLine: true,
              translateTime: "SYS:standard",
            },
          },
        }
      : {}),
  };
}
