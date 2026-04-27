import { z } from "zod";

export const consentRecordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  dataSubjectId: z.string().min(1),
  purpose: z.string().min(3).max(160),
  channel: z.enum(["web", "mobile", "paper", "api"]),
  status: z.enum(["granted", "revoked"]),
  evidenceHash: z.string().min(1),
  grantedAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().optional(),
});

export const privacyRequestSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  dataSubjectId: z.string().min(1),
  type: z.enum(["access", "portability", "correction", "deletion", "anonymization", "consent_revocation"]),
  status: z.enum(["received", "validating_identity", "processing", "completed", "rejected"]),
  dueAt: z.string().datetime(),
  resolutionSummary: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const retentionPolicySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  entity: z.string().min(1),
  retentionDays: z.number().int().min(1),
  actionAfterRetention: z.enum(["archive", "anonymize", "delete"]),
  legalHold: z.boolean().default(false),
});

export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type PrivacyRequest = z.infer<typeof privacyRequestSchema>;
export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;
