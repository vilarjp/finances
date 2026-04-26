import type { FastifyReply, FastifyRequest } from "fastify";

import { unauthorizedError } from "../../shared/errors.js";
import {
  createRecordSchema,
  pasteRecordSchema,
  parseRecordId,
  recordRangeQuerySchema,
  toRecordResponse,
  updateRecordSchema,
} from "./records.schemas.js";
import type { RecordsService } from "./records.service.js";

type RecordParams = {
  recordId: string;
};

function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw unauthorizedError();
  }

  return request.user;
}

export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const records = await this.recordsService.listRecords(
      user.userId,
      recordRangeQuerySchema.parse(request.query),
    );

    return reply.send({
      records: records.map(toRecordResponse),
    });
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const record = await this.recordsService.createRecord(
      user.userId,
      createRecordSchema.parse(request.body),
    );

    return reply.status(201).send({
      record: toRecordResponse(record),
    });
  };

  get = async (
    request: FastifyRequest<{
      Params: RecordParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);
    const record = await this.recordsService.getRecord(
      user.userId,
      parseRecordId(request.params.recordId),
    );

    return reply.send({
      record: toRecordResponse(record),
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: RecordParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);
    const record = await this.recordsService.updateRecord(
      user.userId,
      parseRecordId(request.params.recordId),
      updateRecordSchema.parse(request.body),
    );

    return reply.send({
      record: toRecordResponse(record),
    });
  };

  delete = async (
    request: FastifyRequest<{
      Params: RecordParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);

    await this.recordsService.deleteRecord(user.userId, parseRecordId(request.params.recordId));

    return reply.status(204).send(null);
  };

  paste = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const record = await this.recordsService.pasteRecord(
      user.userId,
      pasteRecordSchema.parse(request.body),
    );

    return reply.status(201).send({
      record: toRecordResponse(record),
    });
  };
}
