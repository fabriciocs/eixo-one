import { describe, expect, it } from 'vitest';

import {
  changeUserStatusCommandSchema,
  contractVersion,
  errorCodeSchema,
  meResponseSchema,
  userProfileSchema,
} from '../src/index.js';

describe('shared contracts', () => {
  it('validates a user profile envelope', () => {
    const result = meResponseSchema.safeParse({
      ok: true,
      data: {
        id: 'user_123',
        tenantId: 'tenant_alpha',
        email: 'admin@eixo.one',
        displayName: 'Eixo Admin',
        status: 'active',
        roleKeys: ['admin'],
        permissionKeys: ['users.read'],
        moduleKeys: ['dashboard'],
        createdAt: '2026-04-26T18:00:00.000Z',
        updatedAt: '2026-04-26T18:00:00.000Z',
        version: 1,
      },
      meta: {
        contractVersion,
        correlationId: 'corr-1234567890',
        requestId: 'req-1234567890',
        timestamp: '2026-04-26T18:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid state transition payload without idempotency key', () => {
    const result = changeUserStatusCommandSchema.safeParse({
      userId: 'user_123',
      actorUserId: 'user_admin',
      tenantId: 'tenant_alpha',
      expectedVersion: 1,
      targetStatus: 'active',
      reason: 'ok',
    });

    expect(result.success).toBe(false);
  });

  it('normalizes user emails to lowercase', () => {
    const parsed = userProfileSchema.parse({
      id: 'user_456',
      tenantId: 'tenant_beta',
      email: 'USER@EIXO.ONE',
      displayName: 'Usuario',
      status: 'invited',
      roleKeys: [],
      permissionKeys: [],
      moduleKeys: [],
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 0,
    });

    expect(parsed.email).toBe('user@eixo.one');
  });

  it('keeps standard error codes explicit and versioned', () => {
    expect(errorCodeSchema.parse('IDEMPOTENCY_CONFLICT')).toBe(
      'IDEMPOTENCY_CONFLICT',
    );
  });
});
