import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../core/errors/app-error.js';
import type { AppDependencies } from '../server.js';

export type VerifiedIdentity = {
  uid: string;
  email?: string;
  tenantId: string;
  roleKeys: string[];
  permissionKeys: string[];
  moduleKeys: string[];
};

export interface AuthVerifier {
  verifyIdToken(idToken: string): Promise<VerifiedIdentity>;
  isReady(): Promise<boolean>;
}

export function authenticationMiddleware(dependencies: AppDependencies) {
  return async function requireAuthentication(
    request: FastifyRequest,
    _reply: FastifyReply,
  ) {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Token ausente ou invalido.');
    }

    const identity = await dependencies.authVerifier.verifyIdToken(
      header.slice('Bearer '.length),
    );

    request.auth = {
      uid: identity.uid,
      email: identity.email,
      tenantId: identity.tenantId,
      roleKeys: identity.roleKeys,
      permissionKeys: identity.permissionKeys,
      moduleKeys: identity.moduleKeys,
    };
  };
}

