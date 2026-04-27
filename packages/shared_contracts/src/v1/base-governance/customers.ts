import { z } from 'zod';
import { auditMetadataSchema } from './common.js';

const cpfCnpjRegex = /^(\d{11}|\d{14})$/;

export const customerAddressSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["billing", "shipping", "commercial", "other"]),
  zipCode: z.string().regex(/^\d{8}$/),
  street: z.string().min(2).max(160),
  number: z.string().min(1).max(20),
  complement: z.string().max(80).optional(),
  district: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().length(2),
  country: z.string().length(2).default("BR"),
});

export const customerContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  role: z.string().max(80).optional(),
  main: z.boolean().default(false),
});

export const customerSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  companyId: z.string().min(1),
  type: z.enum(["person", "company"]),
  document: z.string().regex(cpfCnpjRegex),
  legalName: z.string().min(2).max(160),
  tradeName: z.string().max(160).optional(),
  status: z.enum(["draft", "active", "blocked", "inactive", "archived"]),
  creditLimit: z.number().nonnegative().default(0),
  sellerUserId: z.string().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  addresses: z.array(customerAddressSchema).min(1),
  contacts: z.array(customerContactSchema).default([]),
  audit: auditMetadataSchema,
});

export const createCustomerRequestSchema = customerSchema.omit({ id: true, audit: true, status: true }).extend({
  status: z.enum(["draft", "active"]).default("draft"),
});

export const updateCustomerRequestSchema = createCustomerRequestSchema.partial().extend({
  expectedVersion: z.number().int().nonnegative(),
});

export type Customer = z.infer<typeof customerSchema>;
export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof updateCustomerRequestSchema>;
