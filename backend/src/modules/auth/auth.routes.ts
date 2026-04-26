import type { FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { createRateLimitMiddleware } from "../../middleware/rate-limit.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

export type AuthRoutesOptions = {
  authService: AuthService;
  config: AppConfig;
};

export const authRoutes: FastifyPluginCallback<AuthRoutesOptions> = (app, options, done) => {
  const controller = new AuthController(options.authService, options.config);
  const authRateLimit = createRateLimitMiddleware({
    keyPrefix: "auth",
    logger: app.financeLogger,
    maxAttempts: options.config.authRateLimit.maxAttempts,
    windowMs: options.config.authRateLimit.windowMs,
  });

  app.post("/signup", { preHandler: [authRateLimit] }, controller.signUp);
  app.post("/login", { preHandler: [authRateLimit] }, controller.login);
  app.post(
    "/logout",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.logout,
  );
  app.post("/refresh", { preHandler: [authRateLimit] }, controller.refresh);
  app.get(
    "/csrf",
    {
      preHandler: [app.authenticate],
    },
    controller.csrf,
  );
  app.get(
    "/me",
    {
      preHandler: [app.authenticate],
    },
    controller.me,
  );

  done();
};
