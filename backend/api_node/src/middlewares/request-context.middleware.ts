import crypto from 'node:crypto';

import type { FastifyReply, FastifyRequest } from 'fastify';

export async function requestContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestId = request.id;
  const correlationId =
    (request.headers['x-correlation-id'] as string | undefined)?.trim() ??
    `corr-${crypto.randomUUID()}`;

  request.context = {
    correlationId,
    requestId,
    receivedAt: new Date().toISOString(),
  };

  reply.header('x-correlation-id', correlationId);
  reply.header('x-request-id', requestId);
}

