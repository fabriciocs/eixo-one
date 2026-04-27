import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import { entityMetadataSchema, paginationQuerySchema } from '../metadata.js';
import {
  companyIdSchema,
  countryCodeSchema,
  currencyCodeSchema,
  governanceRecordStatusSchema,
  governanceSearchSchema,
  governanceStatusTransitionBodySchema,
  isoDateSchema,
  legalNameSchema,
  registrationCodeSchema,
  tradeNameSchema,
} from './common.js';

export const companySchema = entityMetadataSchema.extend({
  companyId: companyIdSchema,
  legalName: legalNameSchema,
  tradeName: tradeNameSchema.nullable().optional(),
  legalNameNormalized: z.string().trim().min(3).max(200),
  companyRootRegistration: registrationCodeSchema,
  countryCode: countryCodeSchema,
  legalNatureCode: z.string().trim().min(2).max(40),
  openingDate: isoDateSchema,
  regimeTributario: z.string().trim().min(2).max(40),
  defaultCurrency: currencyCodeSchema,
  fiscalCalendarId: z.string().trim().min(2).max(64),
  consolidationMode: z.string().trim().min(2).max(40),
  primaryEstablishmentId: z.string().trim().min(5).max(64).nullable().optional(),
  groupEconomicId: z.string().trim().min(2).max(64).nullable().optional(),
  status: governanceRecordStatusSchema,
});

export const createCompanyRequestSchema = z.object({
  legalName: legalNameSchema,
  tradeName: tradeNameSchema.optional(),
  companyRootRegistration: registrationCodeSchema,
  countryCode: countryCodeSchema.default('BR'),
  legalNatureCode: z.string().trim().min(2).max(40),
  openingDate: isoDateSchema,
  regimeTributario: z.string().trim().min(2).max(40),
  defaultCurrency: currencyCodeSchema.default('BRL'),
  fiscalCalendarId: z.string().trim().min(2).max(64),
  consolidationMode: z.string().trim().min(2).max(40),
  groupEconomicId: z.string().trim().min(2).max(64).optional(),
});

const updateCompanyFieldsSchema = z.object({
  legalName: legalNameSchema.optional(),
  tradeName: tradeNameSchema.nullable().optional(),
  legalNatureCode: z.string().trim().min(2).max(40).optional(),
  openingDate: isoDateSchema.optional(),
  regimeTributario: z.string().trim().min(2).max(40).optional(),
  defaultCurrency: currencyCodeSchema.optional(),
  fiscalCalendarId: z.string().trim().min(2).max(64).optional(),
  consolidationMode: z.string().trim().min(2).max(40).optional(),
  groupEconomicId: z.string().trim().min(2).max(64).nullable().optional(),
});

export const updateCompanyRequestSchema = updateCompanyFieldsSchema
  .extend({
    expectedVersion: z.number().int().nonnegative(),
  })
  .refine(
    (payload) => Object.keys(payload).some((key) => key !== 'expectedVersion'),
    'Informe ao menos um campo para atualizacao.',
  );

export const listCompaniesQuerySchema = paginationQuerySchema.extend({
  status: governanceRecordStatusSchema.optional(),
  countryCode: countryCodeSchema.optional(),
  regimeTributario: z.string().trim().min(2).max(40).optional(),
  search: governanceSearchSchema.optional(),
});

export const companyResponseSchema = successEnvelopeSchema(companySchema);

export const listCompaniesResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(companySchema),
  }),
);

export const companyStatusTransitionBodySchema =
  governanceStatusTransitionBodySchema;

export type Company = z.infer<typeof companySchema>;
export type CreateCompanyRequest = z.infer<typeof createCompanyRequestSchema>;
export type UpdateCompanyRequest = z.infer<typeof updateCompanyRequestSchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
