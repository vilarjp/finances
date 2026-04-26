import { createHash } from "node:crypto";

import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";

import { HttpError } from "../shared/errors.js";
import type { AppLogger } from "../shared/logger.js";

type RateLimitOptions = {
  keyPrefix: string;
  logger: AppLogger;
  maxAttempts: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  expiresAt: number;
};

function getRouteKey(request: FastifyRequest) {
  return request.routeOptions.url ?? new URL(request.url, "http://localhost").pathname;
}

function getClientIp(request: FastifyRequest) {
  return request.ip;
}

function hashClientIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function createRateLimitError() {
  return new HttpError({
    code: "RATE_LIMITED",
    message: "Too many requests. Try again later.",
    statusCode: 429,
  });
}

export function createRateLimitMiddleware(options: RateLimitOptions): preHandlerHookHandler {
  const buckets = new Map<string, RateLimitBucket>();

  return (request: FastifyRequest, reply: FastifyReply, done) => {
    const now = Date.now();
    const routeKey = getRouteKey(request);
    const clientIp = getClientIp(request);
    const key = `${options.keyPrefix}:${request.method}:${routeKey}:${clientIp}`;
    const existingBucket = buckets.get(key);
    const bucket =
      existingBucket && existingBucket.expiresAt > now
        ? existingBucket
        : {
            count: 0,
            expiresAt: now + options.windowMs,
          };

    bucket.count += 1;
    buckets.set(key, bucket);

    for (const [bucketKey, value] of buckets.entries()) {
      if (value.expiresAt <= now) {
        buckets.delete(bucketKey);
      }
    }

    if (bucket.count <= options.maxAttempts) {
      done();

      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000));

    reply.header("Retry-After", String(retryAfterSeconds));
    options.logger.warn("rate_limit.exceeded", {
      clientIpHash: hashClientIp(clientIp),
      maxAttempts: options.maxAttempts,
      method: request.method,
      path: routeKey,
      requestId: request.id,
      windowMs: options.windowMs,
    });
    done(createRateLimitError());
  };
}
