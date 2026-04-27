import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import { entityMetadataSchema, paginationQuerySchema } from '../metadata.js';
import {
  companyIdSchema,
  countryCodeSchema,
  establishmentIdSchema,
  establishmentTypeSchema,
  governanceRecordStatusSchema,
  governanceSearchSchema,
  governanceStatusTransitionBodySchema,
  isoDateSchema,
  legalNameSchema,
  registrationCodeSchema,
  tradeNameSchema,
} from './common.js';

export const addressSchema = z.object({
  countryCode: countryCodeSchema.default('BR'),
  postalCode: z.string().trim().min(3).max(20).nullable().optional(),
  stateCode: z.string().trim().min(2).max(8).nullable().optional(),
  cityCode: z.string().trim().min(2).max(16).nullable().optional(),
  cityName: z.string().trim().min(2).max(120),
  district: z.string().trim().min(2).max(120).nullable().optional(),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().min(2).max(120).nullable().optional(),
});

export const localTaxRegistrationSchema = z.object({
  type: z.string().trim().min(2).max(40),
  registrationNumber: registrationCodeSchema,
  stateCode: z.string().trim().min(2).max(8).nullable().optional(),
});

export const localLicenseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  authority: z.string().trim().min(2).max(120),
  licenseNumber: registrationCodeSchema,
  expiresAt: isoDateSchema.nullable().optional(),
  notes: z.string().trim().min(2).max(240).nullable().optional(),
});

export const establishmentSchema = entityMetadataSchema.extend({
  establishmentId: establishmentIdSchema,
  companyId: companyIdSchema,
  establishmentType: establishmentTypeSchema,
  isPrincipal: z.boolean(),
  registrationNumber: registrationCodeSchema,
  registrationRoot: registrationCodeSchema,
  establishmentOrder: z.string().trim().min(1).max(20),
  legalNameAtEstablishment: legalNameSchema,
  tradeNameAtEstablishment: tradeNameSchema.nullable().optional(),
  cnaePrincipal: z.string().trim().min(2).max(20),
  cnaesSecundarios: z.array(z.string().trim().min(2).max(20)).max(30).default([]),
  address: addressSchema,
  localTaxRegistrations: z.array(localTaxRegistrationSchema).max(20).default([]),
  localLicenses: z.array(localLicenseSchema).max(20).default([]),
  contactEmail: z.string().trim().toLowerCase().email().max(160).nullable().optional(),
  contactPhone: z.string().trim().min(8).max(32).nullable().optional(),
  isAdministrative: z.boolean().default(false),
  status: governanceRecordStatusSchema,
});

export const createEstablishmentRequestSchema = z.object({
  companyId: companyIdSchema,
  establishmentType: establishmentTypeSchema,
  isPrincipal: z.boolean(),
  registrationNumber: registrationCodeSchema,
  registrationRoot: registrationCodeSchema,
  establishmentOrder: z.string().trim().min(1).max(20),
  legalNameAtEstablishment: legalNameSchema,
  tradeNameAtEstablishment: tradeNameSchema.optional(),
  cnaePrincipal: z.string().trim().min(2).max(20),
  cnaesSecundarios: z.array(z.string().trim().min(2).max(20)).max(30).default([]),
  address: addressSchema,
  localTaxRegistrations: z.array(localTaxRegistrationSchema).max(20).default([]),
  localLicenses: z.array(localLicenseSchema).max(20).default([]),
  contactEmail: z.string().trim().toLowerCase().email().max(160).optional(),
  contactPhone: z.string().trim().min(8).max(32).optional(),
  isAdministrative: z.boolean().default(false),
});

const updateEstablishmentFieldsSchema = z.object({
  establishmentType: establishmentTypeSchema.optional(),
  isPrincipal: z.boolean().optional(),
  registrationNumber: registrationCodeSchema.optional(),
  registrationRoot: registrationCodeSchema.optional(),
  establishmentOrder: z.string().trim().min(1).max(20).optional(),
  legalNameAtEstablishment: legalNameSchema.optional(),
  tradeNameAtEstablishment: tradeNameSchema.nullable().optional(),
  cnaePrincipal: z.string().trim().min(2).max(20).optional(),
  cnaesSecundarios: z.array(z.string().trim().min(2).max(20)).max(30).optional(),
  address: addressSchema.optional(),
  localTaxRegistrations: z.array(localTaxRegistrationSchema).max(20).optional(),
  localLicenses: z.array(localLicenseSchema).max(20).optional(),
  contactEmail: z.string().trim().toLowerCase().email().max(160).nullable().optional(),
  contactPhone: z.string().trim().min(8).max(32).nullable().optional(),
  isAdministrative: z.boolean().optional(),
});

export const updateEstablishmentRequestSchema = updateEstablishmentFieldsSchema
  .extend({
    expectedVersion: z.number().int().nonnegative(),
  })
  .refine(
    (payload) => Object.keys(payload).some((key) => key !== 'expectedVersion'),
    'Informe ao menos um campo para atualizacao.',
  );

export const listEstablishmentsQuerySchema = paginationQuerySchema.extend({
  companyId: companyIdSchema.optional(),
  status: governanceRecordStatusSchema.optional(),
  establishmentType: establishmentTypeSchema.optional(),
  search: governanceSearchSchema.optional(),
});

export const establishmentResponseSchema = successEnvelopeSchema(
  establishmentSchema,
);

export const listEstablishmentsResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(establishmentSchema),
  }),
);

export const establishmentStatusTransitionBodySchema =
  governanceStatusTransitionBodySchema;

export type Address = z.infer<typeof addressSchema>;
export type LocalTaxRegistration = z.infer<typeof localTaxRegistrationSchema>;
export type LocalLicense = z.infer<typeof localLicenseSchema>;
export type Establishment = z.infer<typeof establishmentSchema>;
export type CreateEstablishmentRequest = z.infer<
  typeof createEstablishmentRequestSchema
>;
export type UpdateEstablishmentRequest = z.infer<
  typeof updateEstablishmentRequestSchema
>;
export type ListEstablishmentsQuery = z.infer<
  typeof listEstablishmentsQuerySchema
>;
