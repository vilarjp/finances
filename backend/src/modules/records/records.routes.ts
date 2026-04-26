import type { FastifyPluginCallback } from "fastify";

import { RecordsController } from "./records.controller.js";
import { RecordsService } from "./records.service.js";

export const recordsRoutes: FastifyPluginCallback = (app, _options, done) => {
  if (!app.financeDb) {
    done(new Error("Record routes require a database connection."));

    return;
  }

  const recordsService = new RecordsService(app.financeDb);
  const controller = new RecordsController(recordsService);

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
  app.post(
    "/paste",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.paste,
  );
  app.get<{ Params: { recordId: string } }>(
    "/:recordId",
    {
      preHandler: [app.authenticate],
    },
    controller.get,
  );
  app.patch<{ Params: { recordId: string } }>(
    "/:recordId",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.update,
  );
  app.delete<{ Params: { recordId: string } }>(
    "/:recordId",
    {
      preHandler: [app.authenticate, app.verifyCsrf],
    },
    controller.delete,
  );

  done();
};
