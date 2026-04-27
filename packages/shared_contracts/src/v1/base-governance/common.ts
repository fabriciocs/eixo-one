import { z } from "zod";

export const baseGovernanceModuleSchema = z.enum([
  "governance",
  "settings",
  "data_exchange",
  "notifications",
  "integrations",
  "privacy",
  "customers",
]);

export const baseGovernanceActionSchema = z.enum([
  "read",
  "create",
  "update",
  "delete",
  "approve",
  "export",
  "configure",
  "import",
  "send",
  "reprocess",
  "anonymize",
]);

export const scopedAccessSchema = z.object({
  tenantId: z.string().min(1),
  companyIds: z.array(z.string().min(1)).default([]),
  establishmentIds: z.array(z.string().min(1)).default([]),
  costCenterIds: z.array(z.string().min(1)).default([]),
});

export const auditMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  updatedAt: z.string().datetime().optional(),
  updatedBy: z.string().min(1).optional(),
  version: z.number().int().nonnegative().default(0),
  deletedAt: z.string().datetime().optional(),
  deletedBy: z.string().min(1).optional(),
});

export type BaseGovernanceModule = z.infer<typeof baseGovernanceModuleSchema>;
export type BaseGovernanceAction = z.infer<typeof baseGovernanceActionSchema>;
export type ScopedAccess = z.infer<typeof scopedAccessSchema>;
export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
