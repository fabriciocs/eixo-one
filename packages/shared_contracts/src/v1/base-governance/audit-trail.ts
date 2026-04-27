import { z } from "zod";

export const auditTrailEventSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  actorUserId: z.string().min(1),
  module: z.string().min(1),
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  beforeHash: z.string().optional(),
  afterHash: z.string().optional(),
  diff: z.record(z.string(), z.unknown()).default({}),
  ipAddress: z.string().optional(),
  userAgent: z.string().max(500).optional(),
  correlationId: z.string().min(1),
  createdAt: z.string().datetime(),
  retentionUntil: z.string().datetime().optional(),
});

export const listAuditTrailQuerySchema = z.object({
  tenantId: z.string().min(1),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  actorUserId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type AuditTrailEvent = z.infer<typeof auditTrailEventSchema>;
export type ListAuditTrailQuery = z.infer<typeof listAuditTrailQuerySchema>;
