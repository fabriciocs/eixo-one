import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import { isoTimestampSchema, tenantIdSchema, userIdSchema } from '../metadata.js';
import {
  companyIdSchema,
  establishmentIdSchema,
  establishmentTypeSchema,
  governanceRecordStatusSchema,
} from './common.js';
import { userScopeGrantSchema } from './grants.js';

export const userContextSchema = z.object({
  tenantId: tenantIdSchema,
  userId: userIdSchema,
  activeCompanyId: companyIdSchema.nullable().optional(),
  activeEstablishmentId: establishmentIdSchema.nullable().optional(),
  selectedReadCompanyIds: z.array(companyIdSchema).max(200).default([]),
  selectedReadEstablishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  writeEnabled: z.boolean(),
  lastSwitchedAt: isoTimestampSchema,
  contextVersion: z.number().int().nonnegative(),
});

export const switchOperationalContextRequestSchema = z.object({
  activeCompanyId: companyIdSchema.nullable().optional(),
  activeEstablishmentId: establishmentIdSchema.nullable().optional(),
  selectedReadCompanyIds: z.array(companyIdSchema).max(200).default([]),
  selectedReadEstablishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  writeEnabled: z.boolean(),
});

export const accessibleEstablishmentSummarySchema = z.object({
  establishmentId: establishmentIdSchema,
  companyId: companyIdSchema,
  legalNameAtEstablishment: z.string().trim().min(3).max(200),
  establishmentType: establishmentTypeSchema,
  status: governanceRecordStatusSchema,
});

export const accessibleCompanySummarySchema = z.object({
  companyId: companyIdSchema,
  legalName: z.string().trim().min(3).max(200),
  status: governanceRecordStatusSchema,
  establishments: z.array(accessibleEstablishmentSummarySchema),
});

export const accessibleScopesSummarySchema = z.object({
  grant: userScopeGrantSchema,
  context: userContextSchema.nullable(),
  companies: z.array(accessibleCompanySummarySchema),
});

export const userContextResponseSchema = successEnvelopeSchema(userContextSchema);
export const accessibleScopesResponseSchema = successEnvelopeSchema(
  accessibleScopesSummarySchema,
);

export type UserContext = z.infer<typeof userContextSchema>;
export type SwitchOperationalContextRequest = z.infer<
  typeof switchOperationalContextRequestSchema
>;
export type AccessibleEstablishmentSummary = z.infer<
  typeof accessibleEstablishmentSummarySchema
>;
export type AccessibleCompanySummary = z.infer<
  typeof accessibleCompanySummarySchema
>;
export type AccessibleScopesSummary = z.infer<
  typeof accessibleScopesSummarySchema
>;
