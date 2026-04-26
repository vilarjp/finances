import { z } from "zod";

export const defaultMongoDbUri = "mongodb://localhost:27017/finances?replicaSet=rs0";

const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);
const nodeEnvSchema = z.enum(["development", "test", "production"]);

const envSchema = z.object({
  NODE_ENV: nodeEnvSchema.default("development"),
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: logLevelSchema.default("info"),
  MONGODB_URI: z.string().trim().min(1).default(defaultMongoDbUri),
  COOKIE_SECRET: z.string().trim().min(32),
});

export type AppConfig = {
  nodeEnv: z.infer<typeof nodeEnvSchema>;
  host: string;
  port: number;
  logLevel: z.infer<typeof logLevelSchema>;
  mongodbUri: string;
  cookieSecret: string;
};

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
  } satisfies AppConfig;
}
