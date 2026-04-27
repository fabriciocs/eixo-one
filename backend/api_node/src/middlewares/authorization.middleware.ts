import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../core/errors/app-error.js';
import {
  buildEffectivePermissionKeys,
} from '../modules/base-governance/domain/base-governance-permissions.js';
import type { AppDependencies } from '../server.js';

type AuthorizationDependencies = Pick<
  AppDependencies,
  'baseGovernanceRepository' | 'governanceRepository'
>;

export function authorizationMiddleware(
  dependencies: AuthorizationDependencies,
  permissionKey: string,
) {
  return async function requireAuthorization(
    request: FastifyRequest,
    _reply: FastifyReply,
  ) {
    if (!request.auth) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Sessao nao autenticada.');
    }

    const permissions = request.auth?.permissionKeys ?? [];
    const roles = request.auth?.roleKeys ?? [];

    if (roles.includes('platform_admin') || permissions.includes(permissionKey)) {
      return;
    }

    const storedGrant = await dependencies.governanceRepository.findUserScopeGrant(
      request.auth.tenantId,
      request.auth.uid,
    );

    if (storedGrant) {
      const persistedRoles =
        await dependencies.baseGovernanceRepository.listRolesByKeys(
          request.auth.tenantId,
          storedGrant.roleKeys,
        );
      const effectivePermissions = buildEffectivePermissionKeys({
        claimPermissionKeys: permissions,
        grantPermissionOverrides: storedGrant.permissionOverrides,
        roles: persistedRoles,
      });

      if (effectivePermissions.has(permissionKey)) {
        return;
      }
    }

    throw new AppError(403, 'FORBIDDEN', 'Permissao insuficiente.');
  };
}
