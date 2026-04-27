import { z } from "zod";

export const notificationTemplateSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  key: z.string().regex(/^[a-z0-9_.-]+$/),
  channel: z.enum(["in_app", "email", "whatsapp", "sms", "push", "webhook"]),
  subject: z.string().max(160).optional(),
  body: z.string().min(1).max(5000),
  requiresConsent: z.boolean().default(true),
  status: z.enum(["draft", "active", "inactive", "archived"]),
});

export const notificationDeliverySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  templateId: z.string().min(1),
  recipientUserId: z.string().optional(),
  recipientAddress: z.string().optional(),
  channel: notificationTemplateSchema.shape.channel,
  status: z.enum(["queued", "sent", "failed", "suppressed"]),
  attempts: z.number().int().nonnegative(),
  lastError: z.string().optional(),
  createdAt: z.string().datetime(),
  sentAt: z.string().datetime().optional(),
});

export type NotificationTemplate = z.infer<typeof notificationTemplateSchema>;
export type NotificationDelivery = z.infer<typeof notificationDeliverySchema>;
