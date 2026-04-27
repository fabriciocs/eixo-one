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
  governanceSearchSchema,
  governanceRecordStatusSchema,
} from '../governance/common.js';

const notificationIdentifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{4,63}$/;
const notificationKeyPattern = /^[a-z0-9][a-z0-9._-]{2,119}$/;

export const notificationTemplateIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(notificationIdentifierPattern, 'notificationTemplateId invalido.');

export const notificationDeliveryIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(notificationIdentifierPattern, 'notificationDeliveryId invalido.');

export const notificationTemplateKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(notificationKeyPattern, 'notificationTemplateKey invalido.')
  .transform((value) => value.toLowerCase());

export const notificationChannelSchema = z.enum([
  'in_app',
  'email',
  'whatsapp',
  'sms',
  'push',
  'webhook',
]);

export const notificationTemplateStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
  'archived',
]);

export const notificationDeliveryStatusSchema = z.enum([
  'queued',
  'processing',
  'sent',
  'failed',
  'suppressed',
]);

export const notificationRecipientSchema = z
  .string()
  .trim()
  .min(3)
  .max(200);

export const notificationAttachmentSchema = z.object({
  fileName: z.string().trim().min(3).max(180),
  contentType: z.string().trim().min(3).max(120),
  url: z.string().trim().url().max(600),
});

export const notificationTemplateSchema = z
  .object({
    templateId: notificationTemplateIdSchema,
    tenantId: tenantIdSchema,
    key: notificationTemplateKeySchema,
    moduleKey: z.string().trim().min(2).max(80),
    label: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3).max(240).nullable().optional(),
    channel: notificationChannelSchema,
    eventKey: z.string().trim().min(3).max(120),
    subject: z.string().trim().min(3).max(160).nullable().optional(),
    body: z.string().trim().min(3).max(5000),
    scopeType: z.enum(['TENANT', 'COMPANY', 'ESTABLISHMENT']).default('TENANT'),
    companyId: companyIdSchema.optional(),
    establishmentId: establishmentIdSchema.optional(),
    requiresConsent: z.boolean().default(true),
    allowAttachments: z.boolean().default(false),
    retryLimit: z.number().int().min(0).max(10).default(3),
    status: notificationTemplateStatusSchema,
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

export const notificationDeliverySchema = z.object({
  deliveryId: notificationDeliveryIdSchema,
  tenantId: tenantIdSchema,
  templateId: notificationTemplateIdSchema,
  templateKey: notificationTemplateKeySchema,
  channel: notificationChannelSchema,
  eventKey: z.string().trim().min(3).max(120),
  recipient: notificationRecipientSchema,
  recipientUserId: userIdSchema.optional(),
  companyId: companyIdSchema.optional(),
  establishmentId: establishmentIdSchema.optional(),
  status: notificationDeliveryStatusSchema,
  consentGranted: z.boolean().default(true),
  attemptCount: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().max(10).default(3),
  subject: z.string().trim().min(3).max(160).nullable().optional(),
  body: z.string().trim().min(3).max(5000),
  attachments: z.array(notificationAttachmentSchema).max(5).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  lastError: z.string().trim().min(3).max(240).nullable().optional(),
  queuedAt: isoTimestampSchema,
  sentAt: isoTimestampSchema.optional(),
  updatedAt: isoTimestampSchema.optional(),
  createdBy: userIdSchema,
});

export const createNotificationTemplateRequestSchema = z
  .object({
    key: notificationTemplateKeySchema,
    moduleKey: z.string().trim().min(2).max(80),
    label: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3).max(240).optional(),
    channel: notificationChannelSchema,
    eventKey: z.string().trim().min(3).max(120),
    subject: z.string().trim().min(3).max(160).optional(),
    body: z.string().trim().min(3).max(5000),
    scopeType: z.enum(['TENANT', 'COMPANY', 'ESTABLISHMENT']).default('TENANT'),
    companyId: companyIdSchema.optional(),
    establishmentId: establishmentIdSchema.optional(),
    requiresConsent: z.boolean().default(true),
    allowAttachments: z.boolean().default(false),
    retryLimit: z.number().int().min(0).max(10).default(3),
    status: z.enum(['draft', 'active', 'inactive']).default('draft'),
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

export const sendNotificationRequestSchema = z
  .object({
    templateKey: notificationTemplateKeySchema,
    recipient: notificationRecipientSchema,
    recipientUserId: userIdSchema.optional(),
    companyId: companyIdSchema.optional(),
    establishmentId: establishmentIdSchema.optional(),
    subjectOverride: z.string().trim().min(3).max(160).optional(),
    bodyVariables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
    attachments: z.array(notificationAttachmentSchema).max(5).default([]),
    consentGranted: z.boolean().default(true),
    metadata: z.record(z.string(), z.unknown()).default({}),
  });

export const retryNotificationRequestSchema = z.object({
  expectedStatus: notificationDeliveryStatusSchema.optional(),
});

export const listNotificationTemplatesQuerySchema = z.object({
  search: governanceSearchSchema.optional(),
  channel: notificationChannelSchema.optional(),
  eventKey: z.string().trim().min(2).max(120).optional(),
  status: notificationTemplateStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const listNotificationDeliveriesQuerySchema = z.object({
  search: governanceSearchSchema.optional(),
  channel: notificationChannelSchema.optional(),
  status: notificationDeliveryStatusSchema.optional(),
  templateKey: notificationTemplateKeySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const notificationTemplateResponseSchema = successEnvelopeSchema(
  notificationTemplateSchema,
);

export const notificationDeliveryResponseSchema = successEnvelopeSchema(
  notificationDeliverySchema,
);

export const notificationTemplatesListResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(notificationTemplateSchema),
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

export const notificationDeliveriesListResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(notificationDeliverySchema),
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

export type NotificationTemplate = z.infer<typeof notificationTemplateSchema>;
export type NotificationDelivery = z.infer<typeof notificationDeliverySchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type NotificationTemplateStatus = z.infer<
  typeof notificationTemplateStatusSchema
>;
export type NotificationDeliveryStatus = z.infer<
  typeof notificationDeliveryStatusSchema
>;
export type CreateNotificationTemplateRequest = z.infer<
  typeof createNotificationTemplateRequestSchema
>;
export type SendNotificationRequest = z.infer<
  typeof sendNotificationRequestSchema
>;
export type RetryNotificationRequest = z.infer<
  typeof retryNotificationRequestSchema
>;
export type ListNotificationTemplatesQuery = z.infer<
  typeof listNotificationTemplatesQuerySchema
>;
export type ListNotificationDeliveriesQuery = z.infer<
  typeof listNotificationDeliveriesQuerySchema
>;
