import { z } from 'zod';

import {
  contractVersionSchema,
  isoTimestampSchema,
  tenantIdSchema,
  userIdSchema,
} from './metadata.js';

export const auditSeveritySchema = z.enum(['info', 'warning', 'critical']);

export const auditEventSchema = z.object({
  contractVersion: contractVersionSchema,
  tenantId: tenantIdSchema,
  actorUserId: userIdSchema,
  entityType: z.string().trim().min(2).max(80),
  entityId: z.string().trim().min(2).max(120),
  action: z.string().trim().min(2).max(120),
  severity: auditSeveritySchema,
  correlationId: z.string().trim().min(10).max(128),
  requestId: z.string().trim().min(10).max(128),
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: isoTimestampSchema,
});

export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditSeverity = z.infer<typeof auditSeveritySchema>;

