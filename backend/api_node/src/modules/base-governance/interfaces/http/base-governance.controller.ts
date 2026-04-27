import {
  createNotificationTemplateRequestSchema,
  createExportJobRequestSchema,
  createImportJobRequestSchema,
  createRoleRequestSchema,
  dataJobIdSchema,
  listAuditEventsQuerySchema,
  listDataJobsQuerySchema,
  listNotificationDeliveriesQuerySchema,
  listNotificationTemplatesQuerySchema,
  listRolesQuerySchema,
  notificationDeliveryIdSchema,
  listSettingsQuerySchema,
  resetSettingRequestSchema,
  runImportJobRequestSchema,
  retryNotificationRequestSchema,
  roleIdSchema,
  sendNotificationRequestSchema,
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

const dataJobIdParamsSchema = z.object({
  jobId: dataJobIdSchema,
});

const notificationDeliveryIdParamsSchema = z.object({
  deliveryId: notificationDeliveryIdSchema,
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
    listNotificationTemplates: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const query = listNotificationTemplatesQuerySchema.parse(request.query);
      const result = await dependencies.baseGovernanceService.listNotificationTemplates(
        request.auth!,
        query,
      );

      return sendSuccess(
        request,
        reply,
        { items: result.items },
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
    createNotificationTemplate: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const body = createNotificationTemplateRequestSchema.parse(request.body);
      const template = await dependencies.baseGovernanceService.createNotificationTemplate(
        request.auth!,
        body,
        request.context,
      );

      reply.code(201);
      return sendSuccess(request, reply, template);
    },
    listNotificationDeliveries: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const query = listNotificationDeliveriesQuerySchema.parse(request.query);
      const result = await dependencies.baseGovernanceService.listNotificationDeliveries(
        request.auth!,
        query,
      );

      return sendSuccess(
        request,
        reply,
        { items: result.items },
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
    sendNotification: async (request: FastifyRequest, reply: FastifyReply) => {
      const body = sendNotificationRequestSchema.parse(request.body);
      const delivery = await dependencies.baseGovernanceService.sendNotification(
        request.auth!,
        body,
        request.context,
      );

      reply.code(201);
      return sendSuccess(request, reply, delivery);
    },
    retryNotificationDelivery: async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const params = notificationDeliveryIdParamsSchema.parse(request.params);
      const body = retryNotificationRequestSchema.parse(request.body);
      const delivery = await dependencies.baseGovernanceService.retryNotificationDelivery(
        request.auth!,
        params.deliveryId,
        body,
        request.context,
      );

      return sendSuccess(request, reply, delivery);
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
    listDataJobs: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listDataJobsQuerySchema.parse(request.query);
      const result = await dependencies.baseGovernanceService.listDataJobs(
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
    createImportJob: async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createImportJobRequestSchema.parse(request.body);
      const job = await dependencies.baseGovernanceService.createImportJob(
        request.auth!,
        body,
        request.context,
      );

      reply.code(201);
      return sendSuccess(request, reply, job);
    },
    runImportJob: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = dataJobIdParamsSchema.parse(request.params);
      const body = runImportJobRequestSchema.parse(request.body);
      const job = await dependencies.baseGovernanceService.runImportJob(
        request.auth!,
        params.jobId,
        body,
        request.context,
      );

      return sendSuccess(request, reply, job);
    },
    createExportJob: async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createExportJobRequestSchema.parse(request.body);
      const job = await dependencies.baseGovernanceService.createExportJob(
        request.auth!,
        body,
        request.context,
      );

      reply.code(201);
      return sendSuccess(request, reply, job);
    },
  };
}
