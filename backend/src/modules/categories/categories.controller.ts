import type { FastifyReply, FastifyRequest } from "fastify";

import { unauthorizedError } from "../../shared/errors.js";
import {
  createCategorySchema,
  parseCategoryId,
  toCategoryResponse,
  updateCategorySchema,
} from "./categories.schemas.js";
import type { CategoriesService } from "./categories.service.js";

type CategoryParams = {
  categoryId: string;
};

function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw unauthorizedError();
  }

  return request.user;
}

export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const categories = await this.categoriesService.listCategories(user.userId);

    return reply.send({
      categories: categories.map(toCategoryResponse),
    });
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireUser(request);
    const category = await this.categoriesService.createCategory(
      user.userId,
      createCategorySchema.parse(request.body),
    );

    return reply.status(201).send({
      category: toCategoryResponse(category),
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: CategoryParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);
    const category = await this.categoriesService.updateCategory(
      user.userId,
      parseCategoryId(request.params.categoryId),
      updateCategorySchema.parse(request.body),
    );

    return reply.send({
      category: toCategoryResponse(category),
    });
  };

  delete = async (
    request: FastifyRequest<{
      Params: CategoryParams;
    }>,
    reply: FastifyReply,
  ) => {
    const user = requireUser(request);

    await this.categoriesService.deleteCategory(
      user.userId,
      parseCategoryId(request.params.categoryId),
      new Date(),
      {
        requestId: request.id,
      },
    );

    return reply.status(204).send(null);
  };
}
