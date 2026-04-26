import type { FastifyReply, FastifyRequest } from "fastify";

import { unauthorizedError } from "../../shared/errors.js";
import {
  createRecurringTagSchema,
  parseRecurringTagId,
  toRecurringTagResponse,
  updateRecurringTagAmountSchema,
  updateRecurringTagSchema,
} from "./recurring-tags.schemas.js";
import type { RecurringTagsService } from "./recurring-tags.service.js";

type RecurringTagParams = {
  tagId: string;
};

function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw unauthorizedError();
  }

  return request.user;
}

export class RecurringTagsController {
  constructor(private readonly recurringTagsService: RecurringTagsService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const recurringTags = await this.recurringTagsService.listRecurringTags(user.userId);

    return reply.send({
      recurringTags: recurringTags.map(toRecurringTagResponse),
    });
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const recurringTag = await this.recurringTagsService.createRecurringTag(
      user.userId,
      createRecurringTagSchema.parse(request.body),
    );

    return reply.status(201).send({
      recurringTag: toRecurringTagResponse(recurringTag),
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: RecurringTagParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);
    const recurringTag = await this.recurringTagsService.updateRecurringTag(
      user.userId,
      parseRecurringTagId(request.params.tagId),
      updateRecurringTagSchema.parse(request.body),
    );

    return reply.send({
      recurringTag: toRecurringTagResponse(recurringTag),
    });
  };

  updateAmount = async (
    request: FastifyRequest<{
      Params: RecurringTagParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);
    const result = await this.recurringTagsService.updateRecurringTagAmount(
      user.userId,
      parseRecurringTagId(request.params.tagId),
      updateRecurringTagAmountSchema.parse(request.body),
      new Date(),
      {
        requestId: request.id,
      },
    );

    return reply.send({
      recurringTag: toRecurringTagResponse(result.recurringTag),
      propagation: {
        ...result.propagation,
        cutoffAt: result.propagation.cutoffAt.toISOString(),
      },
    });
  };

  delete = async (
    request: FastifyRequest<{
      Params: RecurringTagParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);

    await this.recurringTagsService.deleteRecurringTag(
      user.userId,
      parseRecurringTagId(request.params.tagId),
      new Date(),
      {
        requestId: request.id,
      },
    );

    return reply.status(204).send(null);
  };
}
