import { z } from 'zod';

import { successEnvelopeSchema } from './api-response.js';
import {
  entityMetadataSchema,
  idempotencyKeySchema,
  paginationQuerySchema,
  tenantIdSchema,
  userIdSchema,
} from './metadata.js';

const roleKeySchema = z.string().trim().min(2).max(80);
const permissionKeySchema = z.string().trim().min(2).max(120);
const moduleKeySchema = z.string().trim().min(2).max(80);

export const userStatusSchema = z.enum([
  'invited',
  'active',
  'suspended',
  'archived',
]);

export const userProfileSchema = entityMetadataSchema.extend({
  id: userIdSchema,
  email: z.string().trim().toLowerCase().email().max(160),
  displayName: z.string().trim().min(2).max(120),
  status: userStatusSchema,
  roleKeys: z.array(roleKeySchema).max(20).default([]),
  permissionKeys: z.array(permissionKeySchema).max(100).default([]),
  moduleKeys: z.array(moduleKeySchema).max(50).default([]),
  lastLoginAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const meResponseSchema = successEnvelopeSchema(userProfileSchema);

export const listUsersQuerySchema = paginationQuerySchema.extend({
  tenantId: tenantIdSchema,
  status: userStatusSchema.optional(),
  search: z.string().trim().min(2).max(80).optional(),
});

export const listUsersResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(userProfileSchema),
  }),
);

export const changeUserStatusBodySchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  targetStatus: userStatusSchema,
  reason: z.string().trim().min(8).max(240),
});

export const changeUserStatusCommandSchema = changeUserStatusBodySchema.extend({
  userId: userIdSchema,
  actorUserId: userIdSchema,
  tenantId: tenantIdSchema,
  idempotencyKey: idempotencyKeySchema,
});

export const changeUserStatusResponseSchema = successEnvelopeSchema(
  z.object({
    user: userProfileSchema,
    transitionApplied: z.boolean(),
  }),
);

export type UserStatus = z.infer<typeof userStatusSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ChangeUserStatusBody = z.infer<typeof changeUserStatusBodySchema>;
export type ChangeUserStatusCommand = z.infer<
  typeof changeUserStatusCommandSchema
>;

