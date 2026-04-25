import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { HttpError } from "../shared/errors.js";

const internalServerErrorMessage = "Internal server error.";

function getErrorProperty(error: unknown, property: "code" | "statusCode"): unknown {
  if (typeof error !== "object" || error === null || !(property in error)) {
    return undefined;
  }

  return (error as Partial<Record<"code" | "statusCode", unknown>>)[property];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function resolveStatusCode(error: unknown) {
  if (error instanceof ZodError) {
    return 400;
  }

  if (error instanceof HttpError) {
    return error.statusCode;
  }

  const statusCode = getErrorProperty(error, "statusCode");

  if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 600) {
    return statusCode;
  }

  return 500;
}

function resolveErrorCode(error: unknown, statusCode: number) {
  if (error instanceof ZodError) {
    return "VALIDATION_ERROR";
  }

  if (error instanceof HttpError) {
    return error.code;
  }

  const code = getErrorProperty(error, "code");

  if (typeof code === "string") {
    return code;
  }

  return statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR";
}

function resolveMessage(error: unknown, statusCode: number) {
  if (error instanceof ZodError) {
    return "Invalid request.";
  }

  if (statusCode >= 500) {
    return internalServerErrorMessage;
  }

  return getErrorMessage(error);
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    const statusCode = resolveStatusCode(error);
    const code = resolveErrorCode(error, statusCode);
    const message = resolveMessage(error, statusCode);

    if (statusCode >= 500) {
      request.log.error({ err: error, requestId: request.id }, "Unhandled request error");
    } else {
      request.log.warn({ err: error, requestId: request.id }, "Handled request error");
    }

    return reply.status(statusCode).send({
      error: {
        code,
        message,
        requestId: request.id,
      },
    });
  });
}
