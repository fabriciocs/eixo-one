import { z } from "zod";
import { auditMetadataSchema, scopedAccessSchema } from "./common";

export const settingValueSchema = z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown())]);

export const settingSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  key: z.string().regex(/^[a-z0-9_.-]+$/),
  module: z.string().min(1),
  scope: scopedAccessSchema,
  value: settingValueSchema,
  sensitive: z.boolean().default(false),
  status: z.enum(["active", "inactive", "archived"]),
  audit: auditMetadataSchema,
});

export const upsertSettingRequestSchema = settingSchema.omit({ id: true, audit: true, status: true }).extend({
  expectedVersion: z.number().int().nonnegative().optional(),
});

export type Setting = z.infer<typeof settingSchema>;
export type UpsertSettingRequest = z.infer<typeof upsertSettingRequestSchema>;
