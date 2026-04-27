import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import {
  isoTimestampSchema,
  paginationMetaSchema,
  tenantIdSchema,
  userIdSchema,
} from '../metadata.js';
import { companyIdSchema, establishmentIdSchema } from '../governance/common.js';

const roleIdentifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{2,63}$/;
const roleKeyPattern = /^[a-z0-9][a-z0-9._-]{1,78}[a-z0-9]$/;

export const roleIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(roleIdentifierPattern, 'roleId invalido.');

export const roleKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(roleKeyPattern, 'roleKey invalido.')
  .transform((value) => value.toLowerCase());

export const permissionKeySchema = z.string().trim().min(3).max(120);

export const costCenterIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(roleIdentifierPattern, 'costCenterId invalido.');

export const roleStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
  'archived',
]);

export const permissionScopeTypeSchema = z.enum([
  'TENANT',
  'COMPANY',
  'ESTABLISHMENT',
  'COST_CENTER',
  'OWNER',
]);

export const baseGovernanceRoleSchema = z.object({
  roleId: roleIdSchema,
  tenantId: tenantIdSchema,
  key: roleKeySchema,
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(240).nullable().optional(),
  permissionKeys: z.array(permissionKeySchema).min(1).max(120),
  companyIds: z.array(companyIdSchema).max(200).default([]),
  establishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  costCenterIds: z.array(costCenterIdSchema).max(500).default([]),
  status: roleStatusSchema,
  version: z.number().int().nonnegative(),
  createdAt: isoTimestampSchema,
  createdBy: userIdSchema,
  updatedAt: isoTimestampSchema.optional(),
  updatedBy: userIdSchema.optional(),
});

export const createRoleRequestSchema = z.object({
  key: roleKeySchema,
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(240).optional(),
  permissionKeys: z.array(permissionKeySchema).min(1).max(120),
  companyIds: z.array(companyIdSchema).max(200).default([]),
  establishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  costCenterIds: z.array(costCenterIdSchema).max(500).default([]),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
});

export const updateRoleRequestSchema = createRoleRequestSchema
  .partial()
  .extend({
    expectedVersion: z.number().int().nonnegative(),
  });

export const listRolesQuerySchema = z.object({
  search: z.string().trim().min(2).max(120).optional(),
  status: roleStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const permissionCatalogEntrySchema = z.object({
  key: permissionKeySchema,
  label: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(240),
  moduleKey: z.string().trim().min(2).max(80),
  actionKey: z.string().trim().min(2).max(80),
  scopeTypes: z.array(permissionScopeTypeSchema).min(1).max(5),
});

export const listAuditEventsQuerySchema = z.object({
  entityType: z.string().trim().min(2).max(80).optional(),
  entityId: z.string().trim().min(2).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const rolesListResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(baseGovernanceRoleSchema),
  }),
).extend({
  meta: z.object({
    contractVersion: z.string(),
    correlationId: z.string(),
    requestId: z.string(),
    timestamp: z.string(),
    pagination: paginationMetaSchema.optional(),
    idempotencyReplayed: z.boolean().optional(),
  }),
});

export const roleResponseSchema = successEnvelopeSchema(baseGovernanceRoleSchema);

export const permissionCatalogResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(permissionCatalogEntrySchema),
  }),
);

export type BaseGovernanceRole = z.infer<typeof baseGovernanceRoleSchema>;
export type BaseGovernanceRoleStatus = z.infer<typeof roleStatusSchema>;
export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
export type PermissionCatalogEntry = z.infer<typeof permissionCatalogEntrySchema>;
export type PermissionScopeType = z.infer<typeof permissionScopeTypeSchema>;
export type ListAuditEventsQuery = z.infer<typeof listAuditEventsQuerySchema>;
