import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { InMemoryIdempotencyStore } from '../../../core/resilience/idempotency-store.js';
import { InMemoryGovernanceRepository } from '../infrastructure/in-memory-governance.repository.js';
import { InMemoryUserRepository } from '../../users/infrastructure/in-memory-user.repository.js';
import { buildServer } from '../../../server.js';
import { StaticAuthVerifier } from '../../../tests/helpers.js';

describe('Governance API', () => {
  const authVerifier = new StaticAuthVerifier({
    'token-admin': {
      uid: 'user_admin',
      email: 'admin@eixo.one',
      tenantId: 'tenant_demo',
      roleKeys: ['platform_admin'],
      permissionKeys: [
        'users.read',
        'users.manage',
        'governance.company.read',
        'governance.company.create',
        'governance.company.update',
        'governance.company.activate',
        'governance.company.inactivate',
        'governance.company.archive',
        'governance.establishment.read',
        'governance.establishment.create',
        'governance.establishment.update',
        'governance.establishment.activate',
        'governance.establishment.inactivate',
        'governance.establishment.archive',
        'governance.user_scope.manage',
        'governance.context.switch',
        'governance.sharing.policy.manage',
        'governance.consolidation.read',
        'governance.consolidation.run',
        'reporting.consolidated.read',
      ],
      moduleKeys: ['dashboard', 'governance'],
    },
    'token-operator': {
      uid: 'user_operator',
      email: 'operador@eixo.one',
      tenantId: 'tenant_demo',
      roleKeys: ['operator'],
      permissionKeys: [
        'governance.company.read',
        'governance.establishment.read',
        'governance.context.switch',
        'reporting.consolidated.read',
      ],
      moduleKeys: ['dashboard', 'governance'],
    },
    'token-external': {
      uid: 'user_external',
      email: 'externo@eixo.one',
      tenantId: 'tenant_ops',
      roleKeys: ['supervisor'],
      permissionKeys: [
        'governance.company.read',
        'governance.establishment.read',
        'governance.context.switch',
        'reporting.consolidated.read',
      ],
      moduleKeys: ['dashboard', 'governance'],
    },
  });

  let app: Awaited<ReturnType<typeof buildServer>>;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createApp() {
    const auditLogWriter = new InMemoryAuditLogWriter();
    const idempotencyStore = new InMemoryIdempotencyStore();
    const userRepository = new InMemoryUserRepository();
    const governanceRepository = new InMemoryGovernanceRepository();

    app = await buildServer({
      env: {
        APP_ENV: 'test',
        DATA_MODE: 'memory',
      },
      authVerifier,
      auditLogWriter,
      idempotencyStore,
      userRepository,
      governanceRepository,
    });

    return app;
  }

  it('lists only the companies inside the caller grant', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/v1/governance/companies?page=1&pageSize=10',
      headers: {
        authorization: 'Bearer token-operator',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.items.map((item: { companyId: string }) => item.companyId)).toEqual([
      'cmp_demo',
    ]);
  });

  it('creates a company once and replays the same idempotent request', async () => {
    const server = await createApp();

    const payload = {
      legalName: 'Nova Empresa SA',
      tradeName: 'Nova Empresa',
      companyRootRegistration: '44556677',
      countryCode: 'BR',
      legalNatureCode: '2062',
      openingDate: '2026-04-26',
      regimeTributario: 'LUCRO_REAL',
      defaultCurrency: 'BRL',
      fiscalCalendarId: 'cal_br_default',
      consolidationMode: 'FULL',
    };

    const firstResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/companies',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-company-001',
      },
      payload,
    });

    const replayedResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/companies',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-company-001',
      },
      payload,
    });

    expect(firstResponse.statusCode).toBe(201);
    expect(replayedResponse.statusCode).toBe(201);
    expect(replayedResponse.json().meta.idempotencyReplayed).toBe(true);
    expect(replayedResponse.headers['x-idempotency-replayed']).toBe('true');
  });

  it('blocks company activation without primary matrix', async () => {
    const server = await createApp();

    const createResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/companies',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-company-002',
      },
      payload: {
        legalName: 'Empresa Sem Matriz LTDA',
        tradeName: 'Sem Matriz',
        companyRootRegistration: '55667788',
        countryCode: 'BR',
        legalNatureCode: '2062',
        openingDate: '2026-04-26',
        regimeTributario: 'LUCRO_REAL',
        defaultCurrency: 'BRL',
        fiscalCalendarId: 'cal_br_default',
        consolidationMode: 'FULL',
      },
    });

    const companyId = createResponse.json().data.companyId as string;

    const activateResponse = await server.inject({
      method: 'POST',
      url: `/v1/governance/companies/${companyId}/activate`,
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        expectedVersion: 1,
      },
    });

    expect(activateResponse.statusCode).toBe(422);
    expect(activateResponse.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('blocks creating a second active primary matrix for the same company', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'POST',
      url: '/v1/governance/establishments',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-establishment-001',
      },
      payload: {
        companyId: 'cmp_demo',
        establishmentType: 'MATRIX',
        isPrincipal: true,
        registrationNumber: '12345678000999',
        registrationRoot: '12345678',
        establishmentOrder: '0009',
        legalNameAtEstablishment: 'Segunda Matriz',
        tradeNameAtEstablishment: 'Matriz 2',
        cnaePrincipal: '6201500',
        cnaesSecundarios: [],
        address: {
          countryCode: 'BR',
          cityName: 'Sao Paulo',
          line1: 'Rua Teste, 100',
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe(
      'COMPANY_ALREADY_HAS_PRIMARY_MATRIX',
    );
  });

  it('blocks an inconsistent grant between company and establishment', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'PUT',
      url: '/v1/governance/users/user_operator/scope-grants',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        companies: [
          {
            companyId: 'cmp_demo',
            establishmentIds: ['est_ops_matrix'],
          },
        ],
        defaultCompanyId: 'cmp_demo',
        defaultEstablishmentId: 'est_ops_matrix',
        readOnlyAllowed: false,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('GRANT_SCOPE_INCONSISTENT');
  });

  it('blocks context switching outside the user grant', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'POST',
      url: '/v1/governance/me/context/switch',
      headers: {
        authorization: 'Bearer token-operator',
      },
      payload: {
        activeCompanyId: 'cmp_ops',
        activeEstablishmentId: 'est_ops_matrix',
        selectedReadCompanyIds: ['cmp_ops'],
        selectedReadEstablishmentIds: ['est_ops_matrix'],
        writeEnabled: true,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('CONTEXT_SCOPE_INVALID');
  });

  it('returns consolidated overview constrained by the caller scope', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/v1/governance/consolidated/overview',
      headers: {
        authorization: 'Bearer token-operator',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.selectedReadCompanyIds).toEqual(['cmp_demo']);
    expect(response.json().data.latestRunStatus).toBeNull();
  });

  it('creates a blocked consolidation run when prechecks fail', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'POST',
      url: '/v1/governance/consolidation-runs',
      headers: {
        authorization: 'Bearer token-admin',
        'x-idempotency-key': 'idem-run-001',
      },
      payload: {
        participantCompanyIds: ['cmp_demo', 'cmp_ops'],
        participantEstablishmentIds: ['est_demo_matrix', 'est_ops_matrix'],
        periodStart: '2026-04-01',
        periodEnd: '2026-04-30',
        fiscalCalendarId: 'cal_br_mismatch',
        currencyCode: 'BRL',
        fxPolicy: {
          type: 'FIXED',
        },
        percentagePolicy: {
          type: 'FULL',
        },
        eliminationMode: 'MANUAL_REVIEW',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data.status).toBe('blocked');
    expect(response.json().data.validationSummary.blockingIssueCount).toBeGreaterThan(
      0,
    );
  });

  it('hides cross-tenant companies from direct lookup', async () => {
    const server = await createApp();

    const response = await server.inject({
      method: 'GET',
      url: '/v1/governance/companies/cmp_demo',
      headers: {
        authorization: 'Bearer token-external',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');
  });
});
