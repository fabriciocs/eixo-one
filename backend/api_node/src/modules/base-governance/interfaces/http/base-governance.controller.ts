import {
  createRoleRequestSchema,
  listAuditEventsQuerySchema,
  listRolesQuerySchema,
  listSettingsQuerySchema,
  resetSettingRequestSchema,
  roleIdSchema,
  settingKeySchema,
  updateRoleRequestSchema,
  updateSettingRequestSchema,
} from '@eixoone/shared-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { sendSuccess } from '../../../../core/contracts/http-response.js';
import type { AppDependencies } from '../../../../server.js';

const roleIdParamsSchema = z.object({
  roleId: roleIdSchema,
});

const settingKeyParamsSchema = z.object({
  settingKey: settingKeySchema,
});

export function createBaseGovernanceController(dependencies: AppDependencies) {
  return {
    listRoles: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listRolesQuerySchema.parse(request.query);
      const result = await dependencies.baseGovernanceService.listRoles(
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
    createRole: async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createRoleRequestSchema.parse(request.body);
      const role = await dependencies.baseGovernanceService.createRole(
        request.auth!,
        body,
        request.context,
      );

      reply.code(201);
      return sendSuccess(request, reply, role);
    },
    updateRole: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = roleIdParamsSchema.parse(request.params);
      const body = updateRoleRequestSchema.parse(request.body);
      const role = await dependencies.baseGovernanceService.updateRole(
        request.auth!,
        params.roleId,
        body,
        request.context,
      );

      return sendSuccess(request, reply, role);
    },
    listPermissionCatalog: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const permissions =
        await dependencies.baseGovernanceService.listPermissionCatalog(
          request.auth!,
        );

      return sendSuccess(request, reply, {
        items: permissions,
      });
    },
    listSettings: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listSettingsQuerySchema.parse(request.query);
      const result = await dependencies.baseGovernanceService.listSettings(
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
    updateSetting: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = settingKeyParamsSchema.parse(request.params);
      const body = updateSettingRequestSchema.parse(request.body);
      const setting = await dependencies.baseGovernanceService.updateSetting(
        request.auth!,
        params.settingKey,
        body,
        request.context,
      );

      return sendSuccess(request, reply, setting);
    },
    resetSetting: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = settingKeyParamsSchema.parse(request.params);
      const body = resetSettingRequestSchema.parse(request.body);
      const setting = await dependencies.baseGovernanceService.resetSetting(
        request.auth!,
        params.settingKey,
        body,
        request.context,
      );

      return sendSuccess(request, reply, setting);
    },
    listAuditEvents: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listAuditEventsQuerySchema.parse(request.query);
      const result = await dependencies.baseGovernanceService.listAuditEvents(
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
  };
}
