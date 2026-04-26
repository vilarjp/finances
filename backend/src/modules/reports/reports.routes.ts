import type { FastifyPluginCallback } from "fastify";

import { ReportsController } from "./reports.controller.js";
import { ReportsService } from "./reports.service.js";

export const reportsRoutes: FastifyPluginCallback = (app, _options, done) => {
  if (!app.financeDb) {
    done(new Error("Report routes require a database connection."));

    return;
  }

  const reportsService = new ReportsService(app.financeDb);
  const controller = new ReportsController(reportsService);

  app.get(
    "/home",
    {
      preHandler: [app.authenticate],
    },
    controller.home,
  );
  app.get(
    "/month",
    {
      preHandler: [app.authenticate],
    },
    controller.month,
  );

  done();
};
