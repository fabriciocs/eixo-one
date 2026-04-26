import { z } from 'zod';

export const contractVersion = 'v1' as const;

const identifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/;
const timestampSchema = z.string().datetime({ offset: true });

export const contractVersionSchema = z.literal(contractVersion);
export const tenantIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(identifierPattern, 'tenantId invalido.');
export const userIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(128)
  .regex(identifierPattern, 'userId invalido.');
export const correlationIdSchema = z
  .string()
  .trim()
  .min(10)
  .max(128);
export const requestIdSchema = z
  .string()
  .trim()
  .min(10)
  .max(128);
export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9:_-]+$/, 'idempotencyKey invalido.');
export const isoTimestampSchema = timestampSchema;

export const entityMetadataSchema = z.object({
  tenantId: tenantIdSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  version: z.number().int().nonnegative(),
});

export const requestContextSchema = z.object({
  tenantId: tenantIdSchema.optional(),
  userId: userIdSchema.optional(),
  correlationId: correlationIdSchema,
  requestId: requestIdSchema,
  idempotencyKey: idempotencyKeySchema.optional(),
  timestamp: isoTimestampSchema,
  contractVersion: contractVersionSchema,
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalItems: z.number().int().min(0),
  hasNextPage: z.boolean(),
});

export type EntityMetadata = z.infer<typeof entityMetadataSchema>;
export type RequestContext = z.infer<typeof requestContextSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

