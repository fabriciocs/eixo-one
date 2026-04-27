import { z } from "zod";

export const dataJobSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  type: z.enum(["import", "export"]),
  entity: z.enum(["roles", "settings", "customers", "audit", "privacy_requests"]),
  format: z.enum(["csv", "xlsx", "pdf"]),
  status: z.enum(["draft", "queued", "processing", "completed", "completed_with_errors", "failed", "cancelled"]),
  fileName: z.string().min(1),
  storagePath: z.string().min(1).optional(),
  totalRows: z.number().int().nonnegative().default(0),
  validRows: z.number().int().nonnegative().default(0),
  invalidRows: z.number().int().nonnegative().default(0),
  errors: z.array(z.object({ row: z.number().int().nonnegative(), field: z.string(), message: z.string() })).default([]),
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const createDataJobRequestSchema = dataJobSchema.pick({ type: true, entity: true, format: true, fileName: true });

export type DataJob = z.infer<typeof dataJobSchema>;
export type CreateDataJobRequest = z.infer<typeof createDataJobRequestSchema>;
