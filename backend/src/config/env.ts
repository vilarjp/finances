import { z } from "zod";

export const defaultMongoDbUri = "mongodb://localhost:27017/finances?replicaSet=rs0";

const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);
const nodeEnvSchema = z.enum(["development", "test", "production"]);
const defaultDevelopmentFrontendOrigins = ["http://127.0.0.1:5173", "http://localhost:5173"];

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema.default("development"),
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: logLevelSchema.default("info"),
  MONGODB_URI: z.string().trim().min(1).default(defaultMongoDbUri),
  COOKIE_SECRET: z.string().trim().min(32),
  FRONTEND_ORIGINS: z.string().optional(),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(20),
});

export type AppConfig = {
  nodeEnv: z.infer<typeof nodeEnvSchema>;
  host: string;
  port: number;
  logLevel: z.infer<typeof logLevelSchema>;
  mongodbUri: string;
  cookieSecret: string;
  frontendOrigins: string[];
  authRateLimit: {
    maxAttempts: number;
    windowMs: number;
  };
};

function parseFrontendOrigins(value: string | undefined, nodeEnv: AppConfig["nodeEnv"]) {
  let rawOrigins: string[];

  if (value !== undefined && value.trim().length > 0) {
    rawOrigins = value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  } else if (nodeEnv === "development") {
    rawOrigins = defaultDevelopmentFrontendOrigins;
  } else {
    rawOrigins = [];
  }

  return rawOrigins.map((origin) => {
    try {
      const url = new URL(origin);

      if (url.origin !== origin || (url.protocol !== "http:" && url.protocol !== "https:")) {
        throw new Error("Invalid origin.");
      }

      return origin;
    } catch {
      throw new Error(`Invalid backend environment: FRONTEND_ORIGINS: Invalid origin ${origin}`);
    }
  });
}

export function parseEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
) {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid backend environment: ${issues}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    host: parsed.data.HOST,
    port: parsed.data.PORT,
    logLevel: parsed.data.LOG_LEVEL,
    mongodbUri: parsed.data.MONGODB_URI,
    cookieSecret: parsed.data.COOKIE_SECRET,
    frontendOrigins: parseFrontendOrigins(parsed.data.FRONTEND_ORIGINS, parsed.data.NODE_ENV),
    authRateLimit: {
      maxAttempts: parsed.data.AUTH_RATE_LIMIT_MAX_ATTEMPTS,
      windowMs: parsed.data.AUTH_RATE_LIMIT_WINDOW_MS,
    },
  } satisfies AppConfig;
}
