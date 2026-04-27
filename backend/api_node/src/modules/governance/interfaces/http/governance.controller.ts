import {
  companyIdSchema,
  companyStatusTransitionBodySchema,
  createCompanyRequestSchema,
  createConsolidationRunRequestSchema,
  createEstablishmentRequestSchema,
  createSharingPolicyRequestSchema,
  establishmentIdSchema,
  establishmentStatusTransitionBodySchema,
  idempotencyKeySchema,
  listCompaniesQuerySchema,
  listConsolidationRunsQuerySchema,
  listEstablishmentsQuerySchema,
  listSharingPoliciesQuerySchema,
  sharingPolicyIdSchema,
  switchOperationalContextRequestSchema,
  updateCompanyRequestSchema,
  updateEstablishmentRequestSchema,
  updateSharingPolicyRequestSchema,
  upsertUserScopeGrantRequestSchema,
} from '@eixoone/shared-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { sendSuccess } from '../../../../core/contracts/http-response.js';
import type { AppDependencies } from '../../../../server.js';

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

function parseIdempotencyKey(request: FastifyRequest) {
  return idempotencyKeySchema.parse(
    String(request.headers['x-idempotency-key'] ?? '').trim(),
  );
}

export function createGovernanceController(dependencies: AppDependencies) {
  return {
    listCompanies: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listCompaniesQuerySchema.parse(request.query);
      const result = await dependencies.governanceService.listCompanies(
        request.auth!,
        query,
      );

      return sendSuccess(
        request,
        reply,
        {
          items: result.items,
        },
        {
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            totalItems: result.totalItems,
            hasNextPage: result.hasNextPage,
          },
        },
      );
    },
    getCompany: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = companyIdParamsSchema.parse(request.params);
      const company = await dependencies.governanceService.getCompany(
        request.auth!,
        params.companyId,
      );

      return sendSuccess(request, reply, company);
    },
    createCompany: async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createCompanyRequestSchema.parse(request.body);
      const { result, replayed } =
        await dependencies.governanceService.createCompany(
          request.auth!,
          body,
          parseIdempotencyKey(request),
          request.context,
        );

      reply.code(201);

      if (replayed) {
        reply.header('x-idempotency-replayed', 'true');
      }

      return sendSuccess(request, reply, result, {
        idempotencyReplayed: replayed,
      });
    },
    updateCompany: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = companyIdParamsSchema.parse(request.params);
      const body = updateCompanyRequestSchema.parse(request.body);
      const company = await dependencies.governanceService.updateCompany(
        request.auth!,
        params.companyId,
        body,
        request.context,
      );

      return sendSuccess(request, reply, company);
    },
    transitionCompanyStatus: async (
      request: FastifyRequest,
      reply: FastifyReply,
      action: 'activate' | 'inactivate' | 'archive',
    ) => {
      const params = companyIdParamsSchema.parse(request.params);
      const body = companyStatusTransitionBodySchema.parse(request.body);
      const company = await dependencies.governanceService.transitionCompanyStatus(
        request.auth!,
        params.companyId,
        action,
        body.expectedVersion,
        body.reason,
        request.context,
      );

      return sendSuccess(request, reply, company);
    },
    listEstablishments: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listEstablishmentsQuerySchema.parse(request.query);
      const result = await dependencies.governanceService.listEstablishments(
        request.auth!,
        query,
      );

      return sendSuccess(
        request,
        reply,
        {
          items: result.items,
        },
        {
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            totalItems: result.totalItems,
            hasNextPage: result.hasNextPage,
          },
        },
      );
    },
    getEstablishment: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = establishmentIdParamsSchema.parse(request.params);
      const establishment = await dependencies.governanceService.getEstablishment(
        request.auth!,
        params.establishmentId,
      );

      return sendSuccess(request, reply, establishment);
    },
    createEstablishment: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const body = createEstablishmentRequestSchema.parse(request.body);
      const { result, replayed } =
        await dependencies.governanceService.createEstablishment(
          request.auth!,
          body,
          parseIdempotencyKey(request),
          request.context,
        );

      reply.code(201);

      if (replayed) {
        reply.header('x-idempotency-replayed', 'true');
      }

      return sendSuccess(request, reply, result, {
        idempotencyReplayed: replayed,
      });
    },
    updateEstablishment: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const params = establishmentIdParamsSchema.parse(request.params);
      const body = updateEstablishmentRequestSchema.parse(request.body);
      const establishment =
        await dependencies.governanceService.updateEstablishment(
          request.auth!,
          params.establishmentId,
          body,
          request.context,
        );

      return sendSuccess(request, reply, establishment);
    },
    transitionEstablishmentStatus: async (
      request: FastifyRequest,
      reply: FastifyReply,
      action: 'activate' | 'inactivate' | 'archive',
    ) => {
      const params = establishmentIdParamsSchema.parse(request.params);
      const body = establishmentStatusTransitionBodySchema.parse(request.body);
      const establishment =
        await dependencies.governanceService.transitionEstablishmentStatus(
          request.auth!,
          params.establishmentId,
          action,
          body.expectedVersion,
          body.reason,
          request.context,
        );

      return sendSuccess(request, reply, establishment);
    },
    getUserScopeGrant: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = userIdParamsSchema.parse(request.params);
      const grant = await dependencies.governanceService.getUserScopeGrant(
        request.auth!,
        params.userId,
      );

      return sendSuccess(request, reply, grant);
    },
    upsertUserScopeGrant: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const params = userIdParamsSchema.parse(request.params);
      const body = upsertUserScopeGrantRequestSchema.parse(request.body);
      const grant = await dependencies.governanceService.upsertUserScopeGrant(
        request.auth!,
        params.userId,
        body,
        request.context,
      );

      return sendSuccess(request, reply, grant);
    },
    getAccessibleScopes: async (request: FastifyRequest, reply: FastifyReply) => {
      const scopes = await dependencies.governanceService.getAccessibleScopes(
        request.auth!,
      );

      return sendSuccess(request, reply, scopes);
    },
    getUserContext: async (request: FastifyRequest, reply: FastifyReply) => {
      const context = await dependencies.governanceService.getUserContext(
        request.auth!,
      );

      return sendSuccess(request, reply, context);
    },
    switchOperationalContext: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const body = switchOperationalContextRequestSchema.parse(request.body);
      const context =
        await dependencies.governanceService.switchOperationalContext(
          request.auth!,
          body,
          request.context,
        );

      return sendSuccess(request, reply, context);
    },
    listSharingPolicies: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listSharingPoliciesQuerySchema.parse(request.query);
      const result = await dependencies.governanceService.listSharingPolicies(
        request.auth!,
        query,
      );

      return sendSuccess(
        request,
        reply,
        {
          items: result.items,
        },
        {
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            totalItems: result.totalItems,
            hasNextPage: result.hasNextPage,
          },
        },
      );
    },
    createSharingPolicy: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const body = createSharingPolicyRequestSchema.parse(request.body);
      const policy = await dependencies.governanceService.createSharingPolicy(
        request.auth!,
        body,
        request.context,
      );

      reply.code(201);
      return sendSuccess(request, reply, policy);
    },
    updateSharingPolicy: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const params = sharingPolicyIdParamsSchema.parse(request.params);
      const body = updateSharingPolicyRequestSchema.parse(request.body);
      const policy = await dependencies.governanceService.updateSharingPolicy(
        request.auth!,
        params.policyId,
        body,
        request.context,
      );

      return sendSuccess(request, reply, policy);
    },
    getConsolidatedOverview: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const overview = await dependencies.governanceService.getConsolidatedOverview(
        request.auth!,
      );

      return sendSuccess(request, reply, overview);
    },
    listConsolidationRuns: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const query = listConsolidationRunsQuerySchema.parse(request.query);
      const result = await dependencies.governanceService.listConsolidationRuns(
        request.auth!,
        query,
      );

      return sendSuccess(
        request,
        reply,
        {
          items: result.items,
        },
        {
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            totalItems: result.totalItems,
            hasNextPage: result.hasNextPage,
          },
        },
      );
    },
    getConsolidationRun: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const params = consolidationRunIdParamsSchema.parse(request.params);
      const run = await dependencies.governanceService.getConsolidationRun(
        request.auth!,
        params.runId,
      );

      return sendSuccess(request, reply, run);
    },
    createConsolidationRun: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const body = createConsolidationRunRequestSchema.parse(request.body);
      const { result, replayed } =
        await dependencies.governanceService.createConsolidationRun(
          request.auth!,
          body,
          parseIdempotencyKey(request),
          request.context,
        );

      reply.code(201);

      if (replayed) {
        reply.header('x-idempotency-replayed', 'true');
      }

      return sendSuccess(request, reply, result, {
        idempotencyReplayed: replayed,
      });
    },
  };
}
