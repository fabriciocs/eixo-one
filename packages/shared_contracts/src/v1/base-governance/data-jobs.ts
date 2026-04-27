import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import {
  isoTimestampSchema,
  paginationMetaSchema,
  tenantIdSchema,
  userIdSchema,
} from '../metadata.js';
import { companyIdSchema, establishmentIdSchema } from '../governance/common.js';

export const dataJobIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9:_-]{4,63}$/);

export const dataJobTypeSchema = z.enum(['import', 'export']);
export const dataJobEntitySchema = z.enum([
  'roles',
  'settings',
  'customers',
  'audit',
  'privacy_requests',
]);
export const dataJobFormatSchema = z.enum(['csv', 'xlsx', 'pdf']);
export const dataJobStatusSchema = z.enum([
  'draft',
  'validated',
  'queued',
  'processing',
  'completed',
  'completed_with_errors',
  'failed',
  'cancelled',
]);
export const dataJobModeSchema = z.enum([
  'create',
  'update',
  'upsert',
  'simulation',
]);

export const dataJobMappingEntrySchema = z.object({
  sourceColumn: z.string().trim().min(1).max(120),
  targetField: z.string().trim().min(1).max(120),
  required: z.boolean().default(false),
});

export const dataJobErrorSchema = z.object({
  row: z.number().int().nonnegative(),
  field: z.string().trim().min(1).max(120),
  message: z.string().trim().min(3).max(240),
});

export const dataJobPreviewRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  values: z.record(z.string(), z.string()),
  valid: z.boolean(),
});

export const dataJobSchema = z.object({
  id: dataJobIdSchema,
  tenantId: tenantIdSchema,
  type: dataJobTypeSchema,
  entity: dataJobEntitySchema,
  format: dataJobFormatSchema,
  status: dataJobStatusSchema,
  fileName: z.string().trim().min(3).max(180),
  companyId: companyIdSchema.optional(),
  establishmentId: establishmentIdSchema.optional(),
  mode: dataJobModeSchema.optional(),
  mapping: z.array(dataJobMappingEntrySchema).max(60).default([]),
  filters: z.record(z.string(), z.unknown()).default({}),
  totalRows: z.number().int().nonnegative().default(0),
  validRows: z.number().int().nonnegative().default(0),
  invalidRows: z.number().int().nonnegative().default(0),
  errors: z.array(dataJobErrorSchema).default([]),
  previewRows: z.array(dataJobPreviewRowSchema).max(20).default([]),
  outputPreview: z.string().max(12000).optional(),
  createdBy: userIdSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema.optional(),
  completedAt: isoTimestampSchema.optional(),
});

export const listDataJobsQuerySchema = z.object({
  search: z.string().trim().min(2).max(120).optional(),
  entity: dataJobEntitySchema.optional(),
  type: dataJobTypeSchema.optional(),
  status: dataJobStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createImportJobRequestSchema = z.object({
  entity: dataJobEntitySchema,
  format: z.enum(['csv', 'xlsx']),
  fileName: z.string().trim().min(3).max(180),
  companyId: companyIdSchema.optional(),
  establishmentId: establishmentIdSchema.optional(),
  mode: dataJobModeSchema.default('simulation'),
  mapping: z.array(dataJobMappingEntrySchema).max(60).default([]),
  content: z.string().min(1).max(200000),
});

export const createExportJobRequestSchema = z.object({
  entity: dataJobEntitySchema,
  format: dataJobFormatSchema,
  fileName: z.string().trim().min(3).max(180),
  companyId: companyIdSchema.optional(),
  establishmentId: establishmentIdSchema.optional(),
  filters: z.record(z.string(), z.unknown()).default({}),
});

export const runImportJobRequestSchema = z.object({
  expectedStatus: dataJobStatusSchema.optional(),
});

export const dataJobResponseSchema = successEnvelopeSchema(dataJobSchema);
export const dataJobsListResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(dataJobSchema),
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

export type DataJob = z.infer<typeof dataJobSchema>;
export type DataJobEntity = z.infer<typeof dataJobEntitySchema>;
export type DataJobError = z.infer<typeof dataJobErrorSchema>;
export type DataJobFormat = z.infer<typeof dataJobFormatSchema>;
export type DataJobMappingEntry = z.infer<typeof dataJobMappingEntrySchema>;
export type DataJobMode = z.infer<typeof dataJobModeSchema>;
export type DataJobPreviewRow = z.infer<typeof dataJobPreviewRowSchema>;
export type DataJobStatus = z.infer<typeof dataJobStatusSchema>;
export type DataJobType = z.infer<typeof dataJobTypeSchema>;
export type ListDataJobsQuery = z.infer<typeof listDataJobsQuerySchema>;
export type CreateImportJobRequest = z.infer<typeof createImportJobRequestSchema>;
export type CreateExportJobRequest = z.infer<typeof createExportJobRequestSchema>;
export type RunImportJobRequest = z.infer<typeof runImportJobRequestSchema>;
