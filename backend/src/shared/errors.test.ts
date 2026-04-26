import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  HttpError,
  conflictError,
  mapErrorToHttpResponse,
  notFoundError,
  validationError,
} from "./errors.js";

describe("shared error mapping", () => {
  it("maps shared HTTP errors into stable response bodies", () => {
    const error = conflictError("Email already exists.", {
      field: "email",
    });

    expect(error).toBeInstanceOf(HttpError);
    expect(mapErrorToHttpResponse(error, { requestId: "request-1" })).toEqual({
      statusCode: 409,
      body: {
        error: {
          code: "CONFLICT",
          message: "Email already exists.",
          requestId: "request-1",
          details: {
            field: "email",
          },
        },
      },
    });
  });

  it("maps validation errors consistently", () => {
    const zodError = z.object({ email: z.email() }).safeParse({ email: "nope" });

    if (zodError.success) {
      throw new Error("Expected invalid test input.");
    }

    expect(mapErrorToHttpResponse(validationError("Bad input."), {})).toMatchObject({
      statusCode: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Bad input.",
        },
      },
    });
    expect(mapErrorToHttpResponse(zodError.error, { requestId: "request-2" })).toMatchObject({
      statusCode: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request.",
          requestId: "request-2",
        },
      },
    });
  });

  it("preserves safe 4xx messages and redacts unhandled 5xx messages", () => {
    expect(mapErrorToHttpResponse(notFoundError("Record not found."), {})).toMatchObject({
      statusCode: 404,
      body: {
        error: {
          code: "NOT_FOUND",
          message: "Record not found.",
        },
      },
    });

    expect(mapErrorToHttpResponse(new Error("Database password leaked in stack"), {})).toEqual({
      statusCode: 500,
      body: {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error.",
        },
      },
    });
  });
});
