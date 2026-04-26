import type { FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { AuthController } from "./auth.controller.js";
import { registerAuthMiddleware } from "./auth.middleware.js";
import { AuthService } from "./auth.service.js";

export type AuthRoutesOptions = {
  config: AppConfig;
};

export const authRoutes: FastifyPluginCallback<AuthRoutesOptions> = (app, options, done) => {
  if (!app.financeDb) {
    done(new Error("Auth routes require a database connection."));

    return;
  }

  const authService = new AuthService(app.financeDb, options.config);
  const controller = new AuthController(authService, options.config);

  registerAuthMiddleware(app, authService);

  app.post("/signup", controller.signUp);
  app.post("/login", controller.login);
  app.post(
    "/logout",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.logout,
  );
  app.post("/refresh", controller.refresh);
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
