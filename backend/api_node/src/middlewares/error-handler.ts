import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { contractVersion } from '@eixoone/shared-contracts';

import { AppError } from '../core/errors/app-error.js';
import { appErrorFromZodError } from '../core/errors/error-mappers.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestContext = request.context;

  const appError =
    error instanceof AppError
      ? error
      : error instanceof ZodError
        ? appErrorFromZodError(error)
        : new AppError(
            500,
            'INTERNAL_ERROR',
            'Erro interno do servidor.',
          );

  request.log.error(
    {
      correlationId: requestContext?.correlationId,
      requestId: requestContext?.requestId,
      userId: request.auth?.uid,
      tenantId: request.auth?.tenantId,
      err: error,
    },
    appError.message,
  );

  return reply.status(appError.statusCode).send({
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    },
    meta: {
      contractVersion,
      correlationId: requestContext?.correlationId ?? 'unknown',
      requestId: requestContext?.requestId ?? request.id,
      timestamp: new Date().toISOString(),
    },
  });
}

