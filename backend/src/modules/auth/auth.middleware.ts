import type {
  FastifyInstance,
  FastifyRequest,
  preHandlerAsyncHookHandler,
  preHandlerHookHandler,
} from "fastify";

import { HttpError } from "../../shared/errors.js";
import { authCookieNames, csrfHeaderName } from "./auth.constants.js";
import { readSignedCookie } from "./auth.cookies.js";
import { AuthService, type AuthenticatedUserContext } from "./auth.service.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: preHandlerAsyncHookHandler;
    verifyCsrf: preHandlerHookHandler;
  }

  interface FastifyRequest {
    user: AuthenticatedUserContext | null;
  }
}

function getCsrfHeader(request: FastifyRequest) {
  const header = request.headers[csrfHeaderName];

  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
}

export function registerAuthMiddleware(app: FastifyInstance, authService: AuthService) {
  app.decorateRequest("user", null);
  app.decorate("authenticate", async (request) => {
    const accessToken = readSignedCookie(
      request,
      authCookieNames.access,
      "ACCESS_TOKEN_MISSING",
      "ACCESS_TOKEN_INVALID",
    );

    request.user = await authService.authenticateAccessToken(accessToken);
  });
  app.decorate("verifyCsrf", (request, _reply, done) => {
    try {
      if (!request.user) {
        throw new HttpError({
          code: "ACCESS_TOKEN_MISSING",
          message: "Access token is required before CSRF validation.",
          statusCode: 401,
        });
      }

      const csrfToken = getCsrfHeader(request);

      if (typeof csrfToken !== "string" || csrfToken.length === 0) {
        throw new HttpError({
          code: "CSRF_TOKEN_INVALID",
          message: "CSRF token is invalid.",
          statusCode: 403,
        });
      }

      authService.verifyCsrfToken(csrfToken, request.user);
      done();
    } catch (error) {
      done(error instanceof Error ? error : new Error("CSRF validation failed."));
    }
  });
}
