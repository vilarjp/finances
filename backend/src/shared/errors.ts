import { ZodError } from "zod";

export type HttpErrorOptions = {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
};

export class HttpError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(options: HttpErrorOptions) {
    super(options.message);
    this.name = "HttpError";
    this.code = options.code;
    this.statusCode = options.statusCode;

    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export type MappedHttpError = {
  statusCode: number;
  body: ErrorResponseBody;
};

export type ErrorMappingOptions = {
  requestId?: string;
};

export const internalServerErrorMessage = "Internal server error.";

function createHttpError(statusCode: number, code: string, message: string, details?: unknown) {
  const options: HttpErrorOptions = {
    code,
    message,
    statusCode,
  };

  if (details !== undefined) {
    options.details = details;
  }

  return new HttpError(options);
}

export function validationError(message = "Invalid request.", details?: unknown) {
  return createHttpError(400, "VALIDATION_ERROR", message, details);
}

export function badRequestError(message = "Bad request.", details?: unknown) {
  return createHttpError(400, "BAD_REQUEST", message, details);
}

export function unauthorizedError(message = "Unauthorized.", details?: unknown) {
  return createHttpError(401, "UNAUTHORIZED", message, details);
}

export function forbiddenError(message = "Forbidden.", details?: unknown) {
  return createHttpError(403, "FORBIDDEN", message, details);
}

export function notFoundError(message = "Not found.", details?: unknown) {
  return createHttpError(404, "NOT_FOUND", message, details);
}

export function conflictError(message = "Conflict.", details?: unknown) {
  return createHttpError(409, "CONFLICT", message, details);
}

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

function resolveDetails(error: unknown, statusCode: number) {
  if (statusCode >= 500) {
    return undefined;
  }

  if (error instanceof ZodError) {
    return {
      issues: error.issues,
    };
  }

  if (error instanceof HttpError) {
    return error.details;
  }

  return undefined;
}

export function mapErrorToHttpResponse(
  error: unknown,
  options: ErrorMappingOptions,
): MappedHttpError {
  const statusCode = resolveStatusCode(error);
  const mappedError: ErrorResponseBody["error"] = {
    code: resolveErrorCode(error, statusCode),
    message: resolveMessage(error, statusCode),
  };
  const details = resolveDetails(error, statusCode);

  if (options.requestId !== undefined) {
    mappedError.requestId = options.requestId;
  }

  if (details !== undefined) {
    mappedError.details = details;
  }

  return {
    statusCode,
    body: {
      error: mappedError,
    },
  };
}
