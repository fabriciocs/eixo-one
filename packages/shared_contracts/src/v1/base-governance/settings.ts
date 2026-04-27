import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import {
  isoTimestampSchema,
  paginationMetaSchema,
  tenantIdSchema,
  userIdSchema,
} from '../metadata.js';
import {
  companyIdSchema,
  establishmentIdSchema,
  governanceRecordStatusSchema,
  governanceSearchSchema,
} from '../governance/common.js';

const settingKeyPattern = /^[a-z0-9][a-z0-9._-]{2,119}$/;

export const settingKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(settingKeyPattern, 'settingKey invalido.')
  .transform((value) => value.toLowerCase());

export const settingScopeTypeSchema = z.enum([
  'GLOBAL',
  'TENANT',
  'COMPANY',
  'ESTABLISHMENT',
]);

export const settingValueTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'json',
]);

export const settingValueSchema = z.union([
  z.string().trim().max(4000),
  z.number().finite(),
  z.boolean(),
  z.record(z.string(), z.unknown()),
]);

export const baseGovernanceSettingSchema = z
  .object({
    settingKey: settingKeySchema,
    tenantId: tenantIdSchema,
    moduleKey: z.string().trim().min(2).max(80),
    category: z.string().trim().min(2).max(80),
    label: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3).max(320).nullable().optional(),
    scopeType: settingScopeTypeSchema,
    companyId: companyIdSchema.optional(),
    establishmentId: establishmentIdSchema.optional(),
    valueType: settingValueTypeSchema,
    value: settingValueSchema,
    defaultValue: settingValueSchema,
    sensitive: z.boolean().default(false),
    status: governanceRecordStatusSchema,
    version: z.number().int().nonnegative(),
    createdAt: isoTimestampSchema,
    createdBy: userIdSchema,
    updatedAt: isoTimestampSchema.optional(),
    updatedBy: userIdSchema.optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.scopeType === 'COMPANY' || value.scopeType === 'ESTABLISHMENT') &&
      !value.companyId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyId'],
        message: 'companyId obrigatorio para o escopo informado.',
      });
    }

    if (value.scopeType === 'ESTABLISHMENT' && !value.establishmentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['establishmentId'],
        message: 'establishmentId obrigatorio para o escopo ESTABLISHMENT.',
      });
    }
  });

export const updateSettingRequestSchema = z
  .object({
    scopeType: settingScopeTypeSchema,
    companyId: companyIdSchema.optional(),
    establishmentId: establishmentIdSchema.optional(),
    value: settingValueSchema,
    expectedVersion: z.number().int().nonnegative(),
  })
  .superRefine((value, context) => {
    if (
      (value.scopeType === 'COMPANY' || value.scopeType === 'ESTABLISHMENT') &&
      !value.companyId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyId'],
        message: 'companyId obrigatorio para o escopo informado.',
      });
    }

    if (value.scopeType === 'ESTABLISHMENT' && !value.establishmentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['establishmentId'],
        message: 'establishmentId obrigatorio para o escopo ESTABLISHMENT.',
      });
    }
  });

export const resetSettingRequestSchema = z
  .object({
    scopeType: settingScopeTypeSchema,
    companyId: companyIdSchema.optional(),
    establishmentId: establishmentIdSchema.optional(),
    expectedVersion: z.number().int().nonnegative(),
  })
  .superRefine((value, context) => {
    if (
      (value.scopeType === 'COMPANY' || value.scopeType === 'ESTABLISHMENT') &&
      !value.companyId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyId'],
        message: 'companyId obrigatorio para o escopo informado.',
      });
    }

    if (value.scopeType === 'ESTABLISHMENT' && !value.establishmentId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['establishmentId'],
        message: 'establishmentId obrigatorio para o escopo ESTABLISHMENT.',
      });
    }
  });

export const listSettingsQuerySchema = z.object({
  search: governanceSearchSchema.optional(),
  moduleKey: z.string().trim().min(2).max(80).optional(),
  scopeType: settingScopeTypeSchema.optional(),
  sensitive: z.coerce.boolean().optional(),
  status: governanceRecordStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const settingsListResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(baseGovernanceSettingSchema),
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

export const settingResponseSchema = successEnvelopeSchema(
  baseGovernanceSettingSchema,
);

export type BaseGovernanceSetting = z.infer<typeof baseGovernanceSettingSchema>;
export type SettingScopeType = z.infer<typeof settingScopeTypeSchema>;
export type SettingValue = z.infer<typeof settingValueSchema>;
export type SettingValueType = z.infer<typeof settingValueTypeSchema>;
export type UpdateSettingRequest = z.infer<typeof updateSettingRequestSchema>;
export type ResetSettingRequest = z.infer<typeof resetSettingRequestSchema>;
export type ListSettingsQuery = z.infer<typeof listSettingsQuerySchema>;
