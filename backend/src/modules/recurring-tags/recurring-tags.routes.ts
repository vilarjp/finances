import type { FastifyPluginCallback } from "fastify";

import { RecurringTagsController } from "./recurring-tags.controller.js";
import { RecurringTagsService } from "./recurring-tags.service.js";

export const recurringTagsRoutes: FastifyPluginCallback = (app, _options, done) => {
  if (!app.financeDb) {
    done(new Error("Recurring tag routes require a database connection."));

    return;
  }

  const recurringTagsService = new RecurringTagsService(app.financeDb, app.financeLogger);
  const controller = new RecurringTagsController(recurringTagsService);

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
  app.patch<{ Params: { tagId: string } }>(
    "/:tagId",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.update,
  );
  app.patch<{ Params: { tagId: string } }>(
    "/:tagId/amount",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.updateAmount,
  );
  app.delete<{ Params: { tagId: string } }>(
    "/:tagId",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.delete,
  );

  done();
};
