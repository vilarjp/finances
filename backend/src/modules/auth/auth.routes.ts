import type { FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

export type AuthRoutesOptions = {
  authService: AuthService;
  config: AppConfig;
};

export const authRoutes: FastifyPluginCallback<AuthRoutesOptions> = (app, options, done) => {
  const controller = new AuthController(options.authService, options.config);

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
