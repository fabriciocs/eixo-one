import { z } from 'zod';

import { apiErrorSchema } from './errors.js';
import {
  contractVersionSchema,
  correlationIdSchema,
  isoTimestampSchema,
  paginationMetaSchema,
  requestIdSchema,
} from './metadata.js';

export const responseMetaSchema = z.object({
  contractVersion: contractVersionSchema,
  correlationId: correlationIdSchema,
  requestId: requestIdSchema,
  timestamp: isoTimestampSchema,
  pagination: paginationMetaSchema.optional(),
  idempotencyReplayed: z.boolean().optional(),
});

export const successEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
    meta: responseMetaSchema,
  });

export const errorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: apiErrorSchema,
  meta: responseMetaSchema,
});

export type ResponseMeta = z.infer<typeof responseMetaSchema>;
export type SuccessEnvelope<T> = {
  ok: true;
  data: T;
  meta: ResponseMeta;
};
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

