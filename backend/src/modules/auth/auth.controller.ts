import type { FastifyReply, FastifyRequest } from "fastify";

import type { AppConfig } from "../../config/env.js";
import {
  clearAuthCookies,
  getAuthCookieNames,
  readOptionalSignedCookie,
  readSignedCookie,
  setAuthCookies,
} from "./auth.cookies.js";
import { loginSchema, signupSchema } from "./auth.schemas.js";
import type { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfig,
  ) {}

  signUp = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await this.authService.signUp(signupSchema.parse(request.body));

    setAuthCookies(reply, this.config, session);

    return reply.status(201).send({
      user: session.user,
    });
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await this.authService.login(loginSchema.parse(request.body));

    setAuthCookies(reply, this.config, session);

    return reply.send({
      user: session.user,
    });
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    const cookieNames = getAuthCookieNames(this.config);

    await this.authService.logout(readOptionalSignedCookie(request, cookieNames.refresh));
    clearAuthCookies(reply, this.config);

    return reply.status(204).send(null);
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply) => {
    const cookieNames = getAuthCookieNames(this.config);
    const refreshToken = readSignedCookie(
      request,
      cookieNames.refresh,
      "REFRESH_TOKEN_MISSING",
      "REFRESH_TOKEN_INVALID",
    );
    const session = await this.authService.refresh(refreshToken);

    setAuthCookies(reply, this.config, session);

    return reply.send({
      user: session.user,
    });
  };

  csrf = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send();
    }

    return reply.send({
      csrfToken: this.authService.createCsrfToken(request.user),
    });
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send();
    }

    return reply.send({
      user: {
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
        createdAt: request.user.createdAt,
        updatedAt: request.user.updatedAt,
      },
    });
  };
}
