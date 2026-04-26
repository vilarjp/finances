import type { FastifyPluginCallback } from "fastify";

import { CategoriesController } from "./categories.controller.js";
import { CategoriesService } from "./categories.service.js";

export const categoriesRoutes: FastifyPluginCallback = (app, _options, done) => {
  if (!app.financeDb) {
    done(new Error("Category routes require a database connection."));

    return;
  }

  const categoriesService = new CategoriesService(app.financeDb);
  const controller = new CategoriesController(categoriesService);

  app.get(
    "/",
    {
      preHandler: [app.authenticate],
    },
    controller.list,
  );
  app.post(
    "/",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.create,
  );
  app.patch<{ Params: { categoryId: string } }>(
    "/:categoryId",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.update,
  );
  app.delete<{ Params: { categoryId: string } }>(
    "/:categoryId",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.delete,
  );

  done();
};
