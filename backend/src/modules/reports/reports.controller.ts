import type { FastifyReply, FastifyRequest } from "fastify";

import { unauthorizedError } from "../../shared/errors.js";
import { homeReportQuerySchema, monthlyReportQuerySchema } from "./reports.schemas.js";
import type { ReportsService } from "./reports.service.js";

function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw unauthorizedError();
  }

  return request.user;
}

export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  home = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const report = await this.reportsService.getHomeReport(
      user.userId,
      homeReportQuerySchema.parse(request.query),
    );

    return reply.send(report);
  };

  month = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const report = await this.reportsService.getMonthlyReport(
      user.userId,
      monthlyReportQuerySchema.parse(request.query),
    );

    return reply.send(report);
  };
}
