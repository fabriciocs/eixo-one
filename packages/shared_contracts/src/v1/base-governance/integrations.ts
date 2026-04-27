import { z } from "zod";

export const integrationCredentialSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  provider: z.string().min(2).max(80),
  authType: z.enum(["oauth2", "api_key", "webhook_secret"]),
  secretRef: z.string().min(1),
  status: z.enum(["active", "inactive", "revoked"]),
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
});

export const webhookSubscriptionSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  eventTypes: z.array(z.string().min(1)).min(1),
  targetUrl: z.string().url(),
  secretRef: z.string().min(1),
  status: z.enum(["active", "inactive", "archived"]),
  createdAt: z.string().datetime(),
});

export const integrationLogSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  integrationId: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]),
  status: z.enum(["accepted", "processed", "failed", "replayed"]),
  idempotencyKey: z.string().optional(),
  payloadHash: z.string().min(1),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type IntegrationCredential = z.infer<typeof integrationCredentialSchema>;
export type WebhookSubscription = z.infer<typeof webhookSubscriptionSchema>;
export type IntegrationLog = z.infer<typeof integrationLogSchema>;
