import {
  createRoleRequestSchema,
  changeUserStatusBodySchema,
  companyIdSchema,
  companyStatusTransitionBodySchema,
  createCompanyRequestSchema,
  createConsolidationRunRequestSchema,
  createEstablishmentRequestSchema,
  createSharingPolicyRequestSchema,
  establishmentIdSchema,
  establishmentStatusTransitionBodySchema,
  listAuditEventsQuerySchema,
  listCompaniesQuerySchema,
  listConsolidationRunsQuerySchema,
  listEstablishmentsQuerySchema,
  listRolesQuerySchema,
  listSettingsQuerySchema,
  listSharingPoliciesQuerySchema,
  listUsersQuerySchema,
  resetSettingRequestSchema,
  roleIdSchema,
  sharingPolicyIdSchema,
  switchOperationalContextRequestSchema,
  updateCompanyRequestSchema,
  updateEstablishmentRequestSchema,
  updateRoleRequestSchema,
  updateSettingRequestSchema,
  updateSharingPolicyRequestSchema,
  upsertUserScopeGrantRequestSchema,
  settingKeySchema,
} from '@eixoone/shared-contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticationMiddleware } from '../middlewares/authentication.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createBaseGovernanceController } from '../modules/base-governance/interfaces/http/base-governance.controller.js';
import { createGovernanceController } from '../modules/governance/interfaces/http/governance.controller.js';
import { createUserController } from '../modules/users/interfaces/http/user.controller.js';
import type { AppDependencies } from '../server.js';

const userIdParamsSchema = z.object({
  userId: z.string().trim().min(3).max(128),
});

const companyIdParamsSchema = z.object({
  companyId: companyIdSchema,
});

const establishmentIdParamsSchema = z.object({
  establishmentId: establishmentIdSchema,
});

const sharingPolicyIdParamsSchema = z.object({
  policyId: sharingPolicyIdSchema,
});

const consolidationRunIdParamsSchema = z.object({
  runId: z.string().trim().min(5).max(64),
});

const roleIdParamsSchema = z.object({
  roleId: roleIdSchema,
});

const settingKeyParamsSchema = z.object({
  settingKey: settingKeySchema,
});

export async function registerRoutes(
  app: FastifyInstance,
  dependencies: AppDependencies,
) {
  const requireAuth = authenticationMiddleware(dependencies);
  const usersController = createUserController(dependencies);
  const governanceController = createGovernanceController(dependencies);
  const baseGovernanceController = createBaseGovernanceController(dependencies);

  app.get('/health', async (_request, reply) => {
    reply.header('cache-control', 'no-store');

    return {
      status: 'ok',
      service: 'eixoone-api',
      environment: dependencies.env.APP_ENV,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  app.get('/ready', async (_request, reply) => {
    const [
      authReady,
      userRepositoryReady,
      governanceRepositoryReady,
      baseGovernanceRepositoryReady,
      auditReady,
      idempotencyReady,
    ] = await Promise.all([
      dependencies.authVerifier.isReady(),
      dependencies.userRepository.isReady(),
      dependencies.governanceRepository.isReady(),
      dependencies.baseGovernanceRepository.isReady(),
      dependencies.auditLogWriter.isReady(),
      dependencies.idempotencyStore.isReady(),
    ]);

    const isReady =
      authReady &&
      userRepositoryReady &&
      governanceRepositoryReady &&
      baseGovernanceRepositoryReady &&
      auditReady &&
      idempotencyReady;

    reply.code(isReady ? 200 : 503);

    return {
      status: isReady ? 'ready' : 'degraded',
      checks: {
        authVerifier: authReady,
        userRepository: userRepositoryReady,
        governanceRepository: governanceRepositoryReady,
        baseGovernanceRepository: baseGovernanceRepositoryReady,
        auditLogWriter: auditReady,
        idempotencyStore: idempotencyReady,
      },
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/v1/me', { preHandler: [requireAuth] }, usersController.me);

  app.get(
    '/v1/users',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'users.read'),
        validateRequest({
          querystring: listUsersQuerySchema.omit({ tenantId: true }),
        }),
      ],
    },
    usersController.list,
  );

  app.post(
    '/v1/users/:userId/status',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'users.manage'),
        validateRequest({
          params: userIdParamsSchema,
          body: changeUserStatusBodySchema,
        }),
      ],
    },
    usersController.changeStatus,
  );

  app.get(
    '/v1/governance/companies',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.read'),
        validateRequest({
          querystring: listCompaniesQuerySchema,
        }),
      ],
    },
    governanceController.listCompanies,
  );

  app.get(
    '/v1/governance/companies/:companyId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.read'),
        validateRequest({
          params: companyIdParamsSchema,
        }),
      ],
    },
    governanceController.getCompany,
  );

  app.post(
    '/v1/governance/companies',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.create'),
        validateRequest({
          body: createCompanyRequestSchema,
        }),
      ],
    },
    governanceController.createCompany,
  );

  app.patch(
    '/v1/governance/companies/:companyId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.update'),
        validateRequest({
          params: companyIdParamsSchema,
          body: updateCompanyRequestSchema,
        }),
      ],
    },
    governanceController.updateCompany,
  );

  app.post(
    '/v1/governance/companies/:companyId/activate',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.activate'),
        validateRequest({
          params: companyIdParamsSchema,
          body: companyStatusTransitionBodySchema,
        }),
      ],
    },
    (request, reply) =>
      governanceController.transitionCompanyStatus(
        request,
        reply,
        'activate',
      ),
  );

  app.post(
    '/v1/governance/companies/:companyId/inactivate',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.inactivate'),
        validateRequest({
          params: companyIdParamsSchema,
          body: companyStatusTransitionBodySchema,
        }),
      ],
    },
    (request, reply) =>
      governanceController.transitionCompanyStatus(
        request,
        reply,
        'inactivate',
      ),
  );

  app.post(
    '/v1/governance/companies/:companyId/archive',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.company.archive'),
        validateRequest({
          params: companyIdParamsSchema,
          body: companyStatusTransitionBodySchema,
        }),
      ],
    },
    (request, reply) =>
      governanceController.transitionCompanyStatus(request, reply, 'archive'),
  );

  app.get(
    '/v1/governance/establishments',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.read'),
        validateRequest({
          querystring: listEstablishmentsQuerySchema,
        }),
      ],
    },
    governanceController.listEstablishments,
  );

  app.get(
    '/v1/governance/establishments/:establishmentId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.read'),
        validateRequest({
          params: establishmentIdParamsSchema,
        }),
      ],
    },
    governanceController.getEstablishment,
  );

  app.post(
    '/v1/governance/establishments',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.create'),
        validateRequest({
          body: createEstablishmentRequestSchema,
        }),
      ],
    },
    governanceController.createEstablishment,
  );

  app.patch(
    '/v1/governance/establishments/:establishmentId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.update'),
        validateRequest({
          params: establishmentIdParamsSchema,
          body: updateEstablishmentRequestSchema,
        }),
      ],
    },
    governanceController.updateEstablishment,
  );

  app.post(
    '/v1/governance/establishments/:establishmentId/activate',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.activate'),
        validateRequest({
          params: establishmentIdParamsSchema,
          body: establishmentStatusTransitionBodySchema,
        }),
      ],
    },
    (request, reply) =>
      governanceController.transitionEstablishmentStatus(
        request,
        reply,
        'activate',
      ),
  );

  app.post(
    '/v1/governance/establishments/:establishmentId/inactivate',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.inactivate'),
        validateRequest({
          params: establishmentIdParamsSchema,
          body: establishmentStatusTransitionBodySchema,
        }),
      ],
    },
    (request, reply) =>
      governanceController.transitionEstablishmentStatus(
        request,
        reply,
        'inactivate',
      ),
  );

  app.post(
    '/v1/governance/establishments/:establishmentId/archive',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.establishment.archive'),
        validateRequest({
          params: establishmentIdParamsSchema,
          body: establishmentStatusTransitionBodySchema,
        }),
      ],
    },
    (request, reply) =>
      governanceController.transitionEstablishmentStatus(
        request,
        reply,
        'archive',
      ),
  );

  app.get(
    '/v1/governance/users/:userId/scope-grants',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.user_scope.manage'),
        validateRequest({
          params: userIdParamsSchema,
        }),
      ],
    },
    governanceController.getUserScopeGrant,
  );

  app.put(
    '/v1/governance/users/:userId/scope-grants',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.user_scope.manage'),
        validateRequest({
          params: userIdParamsSchema,
          body: upsertUserScopeGrantRequestSchema,
        }),
      ],
    },
    governanceController.upsertUserScopeGrant,
  );

  app.get(
    '/v1/governance/me/accessible-scopes',
    {
      preHandler: [requireAuth],
    },
    governanceController.getAccessibleScopes,
  );

  app.get(
    '/v1/governance/me/context',
    {
      preHandler: [requireAuth],
    },
    governanceController.getUserContext,
  );

  app.post(
    '/v1/governance/me/context/switch',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.context.switch'),
        validateRequest({
          body: switchOperationalContextRequestSchema,
        }),
      ],
    },
    governanceController.switchOperationalContext,
  );

  app.get(
    '/v1/governance/sharing-policies',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.sharing.policy.manage'),
        validateRequest({
          querystring: listSharingPoliciesQuerySchema,
        }),
      ],
    },
    governanceController.listSharingPolicies,
  );

  app.post(
    '/v1/governance/sharing-policies',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.sharing.policy.manage'),
        validateRequest({
          body: createSharingPolicyRequestSchema,
        }),
      ],
    },
    governanceController.createSharingPolicy,
  );

  app.patch(
    '/v1/governance/sharing-policies/:policyId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.sharing.policy.manage'),
        validateRequest({
          params: sharingPolicyIdParamsSchema,
          body: updateSharingPolicyRequestSchema,
        }),
      ],
    },
    governanceController.updateSharingPolicy,
  );

  app.get(
    '/v1/governance/consolidated/overview',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'reporting.consolidated.read'),
      ],
    },
    governanceController.getConsolidatedOverview,
  );

  app.get(
    '/v1/governance/consolidation-runs',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.consolidation.read'),
        validateRequest({
          querystring: listConsolidationRunsQuerySchema,
        }),
      ],
    },
    governanceController.listConsolidationRuns,
  );

  app.get(
    '/v1/governance/consolidation-runs/:runId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.consolidation.read'),
        validateRequest({
          params: consolidationRunIdParamsSchema,
        }),
      ],
    },
    governanceController.getConsolidationRun,
  );

  app.post(
    '/v1/governance/consolidation-runs',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'governance.consolidation.run'),
        validateRequest({
          body: createConsolidationRunRequestSchema,
        }),
      ],
    },
    governanceController.createConsolidationRun,
  );

  app.get(
    '/v1/governance/roles',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'roles.read'),
        validateRequest({
          querystring: listRolesQuerySchema,
        }),
      ],
    },
    baseGovernanceController.listRoles,
  );

  app.post(
    '/v1/governance/roles',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'roles.manage'),
        validateRequest({
          body: createRoleRequestSchema,
        }),
      ],
    },
    baseGovernanceController.createRole,
  );

  app.patch(
    '/v1/governance/roles/:roleId',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'roles.manage'),
        validateRequest({
          params: roleIdParamsSchema,
          body: updateRoleRequestSchema,
        }),
      ],
    },
    baseGovernanceController.updateRole,
  );

  app.get(
    '/v1/governance/permissions/catalog',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'roles.read'),
      ],
    },
    baseGovernanceController.listPermissionCatalog,
  );

  app.get(
    '/v1/governance/settings',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'settings.read'),
        validateRequest({
          querystring: listSettingsQuerySchema,
        }),
      ],
    },
    baseGovernanceController.listSettings,
  );

  app.put(
    '/v1/governance/settings/:settingKey',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'settings.manage'),
        validateRequest({
          params: settingKeyParamsSchema,
          body: updateSettingRequestSchema,
        }),
      ],
    },
    baseGovernanceController.updateSetting,
  );

  app.post(
    '/v1/governance/settings/:settingKey/reset',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'settings.manage'),
        validateRequest({
          params: settingKeyParamsSchema,
          body: resetSettingRequestSchema,
        }),
      ],
    },
    baseGovernanceController.resetSetting,
  );

  app.get(
    '/v1/governance/audit-events',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware(dependencies, 'audit.read'),
        validateRequest({
          querystring: listAuditEventsQuerySchema,
        }),
      ],
    },
    baseGovernanceController.listAuditEvents,
  );
}
