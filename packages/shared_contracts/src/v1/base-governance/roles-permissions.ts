import { z } from "zod";
import { auditMetadataSchema, baseGovernanceActionSchema, baseGovernanceModuleSchema, scopedAccessSchema } from "./common";

export const permissionGrantSchema = z.object({
  module: baseGovernanceModuleSchema,
  action: baseGovernanceActionSchema,
  resource: z.string().min(1),
  conditions: z
    .object({
      ownerOnly: z.boolean().default(false),
      requiresMfa: z.boolean().default(false),
      allowedStatuses: z.array(z.string().min(1)).default([]),
    })
    .default({ ownerOnly: false, requiresMfa: false, allowedStatuses: [] }),
});

export const roleSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  key: z.string().regex(/^[a-z0-9_.-]+$/),
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  permissions: z.array(permissionGrantSchema).min(1),
  scope: scopedAccessSchema,
  status: z.enum(["draft", "active", "inactive", "archived"]),
  audit: auditMetadataSchema,
});

export const createRoleRequestSchema = roleSchema
  .omit({ id: true, audit: true, status: true })
  .extend({ status: z.enum(["draft", "active"]).default("draft") });

export const updateRoleRequestSchema = createRoleRequestSchema.partial().extend({
  expectedVersion: z.number().int().nonnegative(),
});

export const checkPermissionRequestSchema = z.object({
  userId: z.string().min(1),
  module: baseGovernanceModuleSchema,
  action: baseGovernanceActionSchema,
  resource: z.string().min(1),
  objectScope: scopedAccessSchema,
  ownerUserId: z.string().min(1).optional(),
  objectStatus: z.string().min(1).optional(),
});

export const checkPermissionResponseSchema = z.object({
  allowed: z.boolean(),
  reason: z.enum(["ALLOWED", "DENY_BY_DEFAULT", "MISSING_SCOPE", "MISSING_PERMISSION", "OWNER_REQUIRED", "MFA_REQUIRED"]),
});

export type PermissionGrant = z.infer<typeof permissionGrantSchema>;
export type Role = z.infer<typeof roleSchema>;
export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;
export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>;
export type CheckPermissionRequest = z.infer<typeof checkPermissionRequestSchema>;
export type CheckPermissionResponse = z.infer<typeof checkPermissionResponseSchema>;
