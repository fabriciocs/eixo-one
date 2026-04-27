import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import { entityMetadataSchema, paginationQuerySchema } from '../metadata.js';
import {
  companyIdSchema,
  governanceDomainKeySchema,
  shareModeSchema,
  sharingPolicyIdSchema,
  sharingPolicyStatusSchema,
  sharingScopeTypeSchema,
} from './common.js';

export const sharingPolicySchema = entityMetadataSchema.extend({
  policyId: sharingPolicyIdSchema,
  domainKey: governanceDomainKeySchema,
  scopeType: sharingScopeTypeSchema,
  shareMode: shareModeSchema,
  participantCompanyIds: z.array(companyIdSchema).max(200).default([]),
  masterCompanyId: companyIdSchema.nullable().optional(),
  policyConfig: z.record(z.unknown()).default({}),
  status: sharingPolicyStatusSchema,
});

export const createSharingPolicyRequestSchema = z.object({
  domainKey: governanceDomainKeySchema,
  scopeType: sharingScopeTypeSchema,
  shareMode: shareModeSchema,
  participantCompanyIds: z.array(companyIdSchema).max(200).default([]),
  masterCompanyId: companyIdSchema.optional(),
  policyConfig: z.record(z.unknown()).default({}),
});

const updateSharingPolicyFieldsSchema = z.object({
  scopeType: sharingScopeTypeSchema.optional(),
  shareMode: shareModeSchema.optional(),
  participantCompanyIds: z.array(companyIdSchema).max(200).optional(),
  masterCompanyId: companyIdSchema.nullable().optional(),
  policyConfig: z.record(z.unknown()).optional(),
  status: sharingPolicyStatusSchema.optional(),
});

export const updateSharingPolicyRequestSchema = updateSharingPolicyFieldsSchema
  .extend({
    expectedVersion: z.number().int().nonnegative(),
  })
  .refine(
    (payload) => Object.keys(payload).some((key) => key !== 'expectedVersion'),
    'Informe ao menos um campo para atualizacao.',
  );

export const listSharingPoliciesQuerySchema = paginationQuerySchema.extend({
  domainKey: governanceDomainKeySchema.optional(),
  status: sharingPolicyStatusSchema.optional(),
});

export const sharingPolicyResponseSchema = successEnvelopeSchema(
  sharingPolicySchema,
);

export const listSharingPoliciesResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(sharingPolicySchema),
  }),
);

export type SharingPolicy = z.infer<typeof sharingPolicySchema>;
export type CreateSharingPolicyRequest = z.infer<
  typeof createSharingPolicyRequestSchema
>;
export type UpdateSharingPolicyRequest = z.infer<
  typeof updateSharingPolicyRequestSchema
>;
export type ListSharingPoliciesQuery = z.infer<
  typeof listSharingPoliciesQuerySchema
>;
