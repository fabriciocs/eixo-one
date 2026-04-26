import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeAny } from 'zod';

import { appErrorFromZodError } from '../core/errors/error-mappers.js';

type ValidationSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  querystring?: ZodTypeAny;
};

export function validateRequest(schemas: ValidationSchemas) {
  return async function validationMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply,
  ) {
    if (schemas.body) {
      const result = schemas.body.safeParse(request.body);

      if (!result.success) {
        throw appErrorFromZodError(result.error);
      }

      (request as FastifyRequest & { body: unknown }).body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(request.params);

      if (!result.success) {
        throw appErrorFromZodError(result.error);
      }

      (request as FastifyRequest & { params: unknown }).params = result.data;
    }

    if (schemas.querystring) {
      const result = schemas.querystring.safeParse(request.query);

      if (!result.success) {
        throw appErrorFromZodError(result.error);
      }

      (request as FastifyRequest & { query: unknown }).query = result.data;
    }
  };
}

