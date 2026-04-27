import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import { isoTimestampSchema, tenantIdSchema, userIdSchema } from '../metadata.js';
import { companyIdSchema, establishmentIdSchema } from './common.js';

export const userScopeGrantCompanySchema = z.object({
  companyId: companyIdSchema,
  establishmentIds: z.array(establishmentIdSchema).max(200).default([]),
});

export const userScopeGrantSchema = z.object({
  tenantId: tenantIdSchema,
  userId: userIdSchema,
  companyScopes: z.array(userScopeGrantCompanySchema).max(200).default([]),
  allowedCompanyIds: z.array(companyIdSchema).max(200),
  allowedEstablishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  defaultCompanyId: companyIdSchema.nullable().optional(),
  defaultEstablishmentId: establishmentIdSchema.nullable().optional(),
  roleKeys: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  permissionOverrides: z
    .array(z.string().trim().min(2).max(120))
    .max(120)
    .default([]),
  readOnlyAllowed: z.boolean(),
  grantsVersion: z.number().int().nonnegative(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export const upsertUserScopeGrantRequestSchema = z.object({
  companies: z.array(userScopeGrantCompanySchema).min(1).max(200),
  defaultCompanyId: companyIdSchema.optional(),
  defaultEstablishmentId: establishmentIdSchema.optional(),
  readOnlyAllowed: z.boolean().default(false),
  roleKeys: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  permissionOverrides: z
    .array(z.string().trim().min(2).max(120))
    .max(120)
    .default([]),
  justification: z.string().trim().min(8).max(240).optional(),
});

export const userScopeGrantResponseSchema = successEnvelopeSchema(
  userScopeGrantSchema,
);

export type UserScopeGrantCompany = z.infer<typeof userScopeGrantCompanySchema>;
export type UserScopeGrant = z.infer<typeof userScopeGrantSchema>;
export type UpsertUserScopeGrantRequest = z.infer<
  typeof upsertUserScopeGrantRequestSchema
>;
