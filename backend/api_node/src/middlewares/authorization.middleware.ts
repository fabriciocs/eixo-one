import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../core/errors/app-error.js';

export function authorizationMiddleware(permissionKey: string) {
  return async function requireAuthorization(
    request: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const permissions = request.auth?.permissionKeys ?? [];
    const roles = request.auth?.roleKeys ?? [];

    if (roles.includes('platform_admin') || permissions.includes(permissionKey)) {
      return;
    }

    throw new AppError(403, 'FORBIDDEN', 'Permissao insuficiente.');
  };
}

