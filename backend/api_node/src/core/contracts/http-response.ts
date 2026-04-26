import { contractVersion, type PaginationMeta } from '@eixoone/shared-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AuthContext, RequestContextState } from '../../middlewares/request-types.js';

type SuccessOptions = {
  pagination?: PaginationMeta;
  idempotencyReplayed?: boolean;
};

function getRequestState(
  request: FastifyRequest,
): RequestContextState & { auth?: AuthContext } {
  return request as RequestContextState & { auth?: AuthContext };
}

export function sendSuccess<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  data: T,
  options: SuccessOptions = {},
) {
  const requestState = getRequestState(request);

  return reply.send({
    ok: true,
    data,
    meta: {
      contractVersion,
      correlationId: requestState.context.correlationId,
      requestId: requestState.context.requestId,
      timestamp: new Date().toISOString(),
      pagination: options.pagination,
      idempotencyReplayed: options.idempotencyReplayed,
    },
  });
}

