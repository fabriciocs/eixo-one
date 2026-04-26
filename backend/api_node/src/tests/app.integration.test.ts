import { afterEach, describe, expect, it } from 'vitest';

import {
  InMemoryAuditLogWriter,
} from '../core/audit/audit-log-writer.js';
import {
  InMemoryIdempotencyStore,
} from '../core/resilience/idempotency-store.js';
import { InMemoryUserRepository } from '../modules/users/infrastructure/in-memory-user.repository.js';
import { buildServer } from '../server.js';
import { StaticAuthVerifier } from './helpers.js';

describe('EixoOne API', () => {
  const auditLogWriter = new InMemoryAuditLogWriter();
  const idempotencyStore = new InMemoryIdempotencyStore();
  const userRepository = new InMemoryUserRepository();
  const authVerifier = new StaticAuthVerifier({
    'token-admin': {
      uid: 'user_admin',
      email: 'admin@eixo.one',
      tenantId: 'tenant_demo',
      roleKeys: ['platform_admin'],
      permissionKeys: ['users.read', 'users.manage'],
      moduleKeys: ['dashboard', 'users'],
    },
    'token-reader': {
      uid: 'user_operator',
      email: 'operador@eixo.one',
      tenantId: 'tenant_demo',
      roleKeys: ['operator'],
      permissionKeys: ['users.read'],
      moduleKeys: ['dashboard', 'users'],
    },
  });

  let app: Awaited<ReturnType<typeof buildServer>>;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createApp() {
    app = await buildServer({
      env: {
        APP_ENV: 'test',
        DATA_MODE: 'memory',
      },
      authVerifier,
      auditLogWriter,
      idempotencyStore,
      userRepository,
    });

    return app;
  }

  it('responds to /health', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ok');
  });

  it('rejects /v1/me without token', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/v1/me',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().ok).toBe(false);
    expect(response.json().error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the authenticated profile on /v1/me', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/v1/me',
      headers: {
        authorization: 'Bearer token-admin',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.id).toBe('user_admin');
    expect(response.json().meta.contractVersion).toBe('v1');
  });

  it('lists users with pagination', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/v1/users?page=1&pageSize=1',
      headers: {
        authorization: 'Bearer token-reader',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.items).toHaveLength(1);
    expect(response.json().meta.pagination.hasNextPage).toBe(true);
  });

  it('applies a valid user status transition once and replays duplicates', async () => {
    const server = await createApp();

    const firstResponse = await server.inject({
      method: 'POST',
      url: '/v1/users/user_operator/status',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-user-operator-001',
      },
      payload: {
        expectedVersion: 1,
        targetStatus: 'active',
        reason: 'Ativacao apos conclusao do onboarding.',
      },
    });

    const replayedResponse = await server.inject({
      method: 'POST',
      url: '/v1/users/user_operator/status',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-user-operator-001',
      },
      payload: {
        expectedVersion: 1,
        targetStatus: 'active',
        reason: 'Ativacao apos conclusao do onboarding.',
      },
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.json().data.user.status).toBe('active');
    expect(replayedResponse.statusCode).toBe(200);
    expect(replayedResponse.json().meta.idempotencyReplayed).toBe(true);
    expect(replayedResponse.headers['x-idempotency-replayed']).toBe('true');
    expect(auditLogWriter.events).toHaveLength(1);
  });

  it('blocks invalid status transitions', async () => {
    const server = await createApp();

    await server.inject({
      method: 'POST',
      url: '/v1/users/user_operator/status',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-user-operator-002',
      },
      payload: {
        expectedVersion: 1,
        targetStatus: 'active',
        reason: 'Ativacao apos conclusao do onboarding.',
      },
    });

    const response = await server.inject({
      method: 'POST',
      url: '/v1/users/user_operator/status',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-user-operator-003',
      },
      payload: {
        expectedVersion: 2,
        targetStatus: 'invited',
        reason: 'Tentativa de retroceder estado sem suporte.',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('INVALID_STATE_TRANSITION');
  });
});
