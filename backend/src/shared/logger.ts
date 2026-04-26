import type { AppConfig } from "../config/env.js";

export type AppLogLevel = AppConfig["logLevel"];

export type AppLogContext = Record<string, unknown>;

export type AppLogger = {
  audit: (event: string, context?: AppLogContext) => void;
  debug: (event: string, context?: AppLogContext) => void;
  error: (event: string, context?: AppLogContext) => void;
  fatal: (event: string, context?: AppLogContext) => void;
  info: (event: string, context?: AppLogContext) => void;
  trace: (event: string, context?: AppLogContext) => void;
  warn: (event: string, context?: AppLogContext) => void;
};

type ConsoleLoggerConfig = Pick<AppConfig, "logLevel" | "nodeEnv">;

type ConsoleLogLevel = Exclude<AppLogLevel, "silent"> | "audit";

type LogSink = (line: string) => void;

const logLevelPriority: Record<ConsoleLogLevel, number> = {
  trace: 10,
  debug: 20,
  audit: 30,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const redactedKeyFragments = [
  "authorization",
  "cookie",
  "description",
  "label",
  "password",
  "secret",
  "token",
  "amount",
];

export function createNoopLogger(): AppLogger {
  const noop = () => undefined;

  return {
    audit: noop,
    debug: noop,
    error: noop,
    fatal: noop,
    info: noop,
    trace: noop,
    warn: noop,
  };
}

function shouldLog(configuredLevel: AppLogLevel, messageLevel: ConsoleLogLevel) {
  if (configuredLevel === "silent") {
    return false;
  }

  return logLevelPriority[messageLevel] >= logLevelPriority[configuredLevel];
}

function shouldRedactKey(key: string) {
  const normalizedKey = key.toLowerCase();

  return redactedKeyFragments.some((fragment) => normalizedKey.includes(fragment));
}

function sanitizeValue(value: unknown, key = ""): unknown {
  if (key && shouldRedactKey(key)) {
    return "[REDACTED]";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    const { code } = value as { code?: unknown };

    return {
      name: value.name,
      ...(typeof code === "string" ? { code } : {}),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeValue(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function writeLogLine(
  sink: LogSink,
  level: ConsoleLogLevel,
  event: string,
  context: AppLogContext | undefined,
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(context ? { context: sanitizeValue(context) } : {}),
  };

  sink(JSON.stringify(entry));
}

export function createConsoleLogger(
  config: ConsoleLoggerConfig,
  sink: LogSink = (line) => console.log(line),
): AppLogger {
  if (config.nodeEnv === "test") {
    return createNoopLogger();
  }

  const log =
    (level: ConsoleLogLevel) =>
    (event: string, context?: AppLogContext): void => {
      if (!shouldLog(config.logLevel, level)) {
        return;
      }

      writeLogLine(sink, level, event, context);
    };

  return {
    audit: log("audit"),
    debug: log("debug"),
    error: log("error"),
    fatal: log("fatal"),
    info: log("info"),
    trace: log("trace"),
    warn: log("warn"),
  };
}
