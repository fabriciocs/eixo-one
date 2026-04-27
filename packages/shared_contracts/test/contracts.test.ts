import { describe, expect, it } from 'vitest';

import {
  consolidatedOverviewSchema,
  changeUserStatusCommandSchema,
  createConsolidationRunRequestSchema,
  createEstablishmentRequestSchema,
  createSharingPolicyRequestSchema,
  createCompanyRequestSchema,
  contractVersion,
  errorCodeSchema,
  switchOperationalContextRequestSchema,
  upsertUserScopeGrantRequestSchema,
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

  it('accepts a valid company payload for governance', () => {
    const parsed = createCompanyRequestSchema.parse({
      legalName: 'Acme Industria LTDA',
      tradeName: 'Acme',
      companyRootRegistration: '12abc345',
      countryCode: 'br',
      legalNatureCode: '2062',
      openingDate: '2026-04-26',
      regimeTributario: 'LUCRO_REAL',
      defaultCurrency: 'brl',
      fiscalCalendarId: 'cal_br_default',
      consolidationMode: 'FULL',
    });

    expect(parsed.countryCode).toBe('BR');
    expect(parsed.defaultCurrency).toBe('BRL');
    expect(parsed.companyRootRegistration).toBe('12ABC345');
  });

  it('rejects establishment payload without explicit establishment type', () => {
    const result = createEstablishmentRequestSchema.safeParse({
      companyId: 'cmp_demo',
      isPrincipal: true,
      registrationNumber: '12345678000100',
      registrationRoot: '12345678',
      establishmentOrder: '0001',
      legalNameAtEstablishment: 'Matriz Demo',
      cnaePrincipal: '6201500',
      address: {
        countryCode: 'BR',
        cityName: 'Sao Paulo',
        line1: 'Av. Paulista, 1000',
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts a coherent grant, context and consolidation payload set', () => {
    const grant = upsertUserScopeGrantRequestSchema.parse({
      companies: [
        {
          companyId: 'cmp_demo',
          establishmentIds: ['est_demo_matrix'],
        },
      ],
      defaultCompanyId: 'cmp_demo',
      defaultEstablishmentId: 'est_demo_matrix',
      readOnlyAllowed: false,
    });

    const context = switchOperationalContextRequestSchema.parse({
      activeCompanyId: 'cmp_demo',
      activeEstablishmentId: 'est_demo_matrix',
      selectedReadCompanyIds: ['cmp_demo'],
      selectedReadEstablishmentIds: ['est_demo_matrix'],
      writeEnabled: true,
    });

    const run = createConsolidationRunRequestSchema.parse({
      participantCompanyIds: ['cmp_demo', 'cmp_ops'],
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      fiscalCalendarId: 'cal_br_default',
      currencyCode: 'BRL',
      fxPolicy: {
        type: 'FIXED',
      },
      percentagePolicy: {
        type: 'FULL',
      },
      eliminationMode: 'MANUAL_REVIEW',
    });

    const policy = createSharingPolicyRequestSchema.parse({
      domainKey: 'catalog',
      scopeType: 'COMPANY',
      shareMode: 'SINGLE_MASTER',
      participantCompanyIds: ['cmp_demo', 'cmp_ops'],
      masterCompanyId: 'cmp_demo',
    });

    const overview = consolidatedOverviewSchema.parse({
      writeContextCompanyId: 'cmp_demo',
      writeContextEstablishmentId: 'est_demo_matrix',
      selectedReadCompanyIds: ['cmp_demo'],
      selectedReadEstablishmentIds: ['est_demo_matrix'],
      activeCompanyCount: 1,
      activeEstablishmentCount: 1,
      latestRunStatus: 'queued',
      companyStatuses: [
        {
          companyId: 'cmp_demo',
          status: 'active',
        },
      ],
    });

    expect(grant.defaultCompanyId).toBe('cmp_demo');
    expect(context.writeEnabled).toBe(true);
    expect(run.participantCompanyIds).toHaveLength(2);
    expect(policy.shareMode).toBe('SINGLE_MASTER');
    expect(overview.latestRunStatus).toBe('queued');
  });
});
