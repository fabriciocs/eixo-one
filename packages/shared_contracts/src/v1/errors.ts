import { z } from 'zod';

export const errorCodeValues = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'CONFLICT',
  'VERSION_CONFLICT',
  'NOT_FOUND',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'TIMEOUT',
  'INTERNAL_ERROR',
  'INVALID_STATE_TRANSITION',
  'IDEMPOTENCY_CONFLICT',
  'TENANT_ACCESS_DENIED',
  'COMPANY_ACCESS_DENIED',
  'BRANCH_ACCESS_DENIED',
  'DUPLICATE_RECORD',
  'COMPANY_ALREADY_HAS_PRIMARY_MATRIX',
  'GRANT_SCOPE_INCONSISTENT',
  'INVALID_ESTABLISHMENT_TYPE',
  'ARCHIVE_BLOCKED',
  'CONTEXT_SCOPE_INVALID',
  'SHARING_POLICY_INVALID',
  'CONSOLIDATION_PARAMETERS_INCOMPLETE',
  'CONSOLIDATION_MAPPING_MISSING',
  'CONSOLIDATION_RUN_IN_PROGRESS',
] as const;

export const errorCodeSchema = z.enum(errorCodeValues);

export const errorDetailSchema = z.object({
  field: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(240),
  code: z.string().trim().min(1).max(120).optional(),
});

export const apiErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string().trim().min(1).max(240),
  details: z.array(errorDetailSchema).default([]),
});

export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
