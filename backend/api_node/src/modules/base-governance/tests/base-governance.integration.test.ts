import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { InMemoryIdempotencyStore } from '../../../core/resilience/idempotency-store.js';
import { buildServer } from '../../../server.js';
import { StaticAuthVerifier } from '../../../tests/helpers.js';
import { InMemoryGovernanceRepository } from '../../governance/infrastructure/in-memory-governance.repository.js';
import { InMemoryUserRepository } from '../../users/infrastructure/in-memory-user.repository.js';

describe('Base Governance API', () => {
  const authVerifier = new StaticAuthVerifier({
    'token-admin': {
      uid: 'user_admin',
      email: 'admin@eixo.one',
      tenantId: 'tenant_demo',
      roleKeys: ['platform_admin'],
      permissionKeys: [
        'users.read',
        'users.manage',
        'roles.read',
        'roles.manage',
        'settings.read',
        'settings.manage',
        'notifications.read',
        'notifications.manage',
        'audit.read',
        'data_jobs.read',
        'data_jobs.manage',
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
      moduleKeys: ['dashboard', 'governance', 'roles', 'audit'],
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
      auditLogWriter: new InMemoryAuditLogWriter(),
      idempotencyStore: new InMemoryIdempotencyStore(),
      userRepository: new InMemoryUserRepository(),
      governanceRepository: new InMemoryGovernanceRepository(),
    });

    return app;
  }

  it('creates, updates and audits administrable roles', async () => {
    const server = await createApp();

    const createResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/roles',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        key: 'fiscal.approver',
        name: 'Fiscal aprovacao',
        description: 'Aprova cadastros sensiveis do modulo fiscal.',
        permissionKeys: [
          'governance.company.read',
          'governance.establishment.read',
        ],
        companyIds: ['cmp_demo'],
        establishmentIds: ['est_demo_matrix'],
        costCenterIds: [],
        status: 'active',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdRole = createResponse.json().data as {
      roleId: string;
      version: number;
    };

    const updateResponse = await server.inject({
      method: 'PATCH',
      url: `/v1/governance/roles/${createdRole.roleId}`,
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        expectedVersion: createdRole.version,
        name: 'Fiscal aprovacao senior',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().data.name).toBe('Fiscal aprovacao senior');

    const auditResponse = await server.inject({
      method: 'GET',
      url: `/v1/governance/audit-events?entityType=role&entityId=${createdRole.roleId}`,
      headers: {
        authorization: 'Bearer token-admin',
      },
    });

    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json().data.items).toHaveLength(2);
  });

  it('lists, updates and resets versioned settings', async () => {
    const server = await createApp();

    const listResponse = await server.inject({
      method: 'GET',
      url: '/v1/governance/settings?page=1&pageSize=20&moduleKey=governance',
      headers: {
        authorization: 'Bearer token-admin',
      },
    });

    expect(listResponse.statusCode).toBe(200);
    const currentSetting = listResponse
      .json()
      .data.items.find(
        (item: { settingKey: string }) =>
          item.settingKey === 'governance.numbering.invoice_series',
      ) as {
      settingKey: string;
      version: number;
      scopeType: 'COMPANY';
      companyId: string;
    };

    const updateResponse = await server.inject({
      method: 'PUT',
      url: `/v1/governance/settings/${currentSetting.settingKey}`,
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        scopeType: currentSetting.scopeType,
        companyId: currentSetting.companyId,
        value: {
          prefix: 'NFS',
          nextNumber: 2200,
        },
        expectedVersion: currentSetting.version,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().data.value.prefix).toBe('NFS');

    const resetResponse = await server.inject({
      method: 'POST',
      url: `/v1/governance/settings/${currentSetting.settingKey}/reset`,
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        scopeType: currentSetting.scopeType,
        companyId: currentSetting.companyId,
        expectedVersion: updateResponse.json().data.version,
      },
    });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.json().data.value.prefix).toBe('NF');

    const auditResponse = await server.inject({
      method: 'GET',
      url: '/v1/governance/audit-events?entityType=setting&entityId=governance.numbering.invoice_series',
      headers: {
        authorization: 'Bearer token-admin',
      },
    });

    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json().data.items).toHaveLength(2);
  });

  it('creates templates, sends notifications and retries failures', async () => {
    const server = await createApp();

    const listResponse = await server.inject({
      method: 'GET',
      url: '/v1/governance/notifications/templates?page=1&pageSize=20',
      headers: {
        authorization: 'Bearer token-admin',
      },
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().data.items.length).toBeGreaterThan(0);

    const createTemplateResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/notifications/templates',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        key: 'notifications.manual.followup.email',
        moduleKey: 'notifications',
        label: 'Follow-up manual',
        channel: 'email',
        eventKey: 'manual.followup',
        subject: 'Pendencia em aberto',
        body: 'Olá {{customerName}}, existe uma pendência para {{documentCode}}.',
        scopeType: 'TENANT',
        requiresConsent: true,
        allowAttachments: false,
        retryLimit: 2,
        status: 'active',
      },
    });

    expect(createTemplateResponse.statusCode).toBe(201);
    expect(createTemplateResponse.json().data.key).toBe(
      'notifications.manual.followup.email',
    );

    const sendResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/notifications/send',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        templateKey: 'notifications.manual.followup.email',
        recipient: 'financeiro@cliente.com',
        bodyVariables: {
          customerName: 'Cliente Demo',
          documentCode: 'DOC-101',
        },
        consentGranted: true,
        metadata: {
          source: 'integration-test',
        },
      },
    });

    expect(sendResponse.statusCode).toBe(201);
    expect(sendResponse.json().data.status).toBe('sent');

    const failedResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/notifications/send',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        templateKey: 'notifications.manual.followup.email',
        recipient: 'fail@cliente.com',
        bodyVariables: {
          customerName: 'Cliente Demo',
          documentCode: 'DOC-102',
        },
        consentGranted: true,
        metadata: {},
      },
    });

    expect(failedResponse.statusCode).toBe(201);
    expect(failedResponse.json().data.status).toBe('failed');

    const retryResponse = await server.inject({
      method: 'POST',
      url: `/v1/governance/notifications/deliveries/${failedResponse.json().data.deliveryId}/retry`,
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        expectedStatus: 'failed',
      },
    });

    expect(retryResponse.statusCode).toBe(200);
    expect(retryResponse.json().data.status).toBe('sent');
  });

  it('authorizes access through persisted role grants even without claim permission', async () => {
    const server = await createApp();

    const createRoleResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/roles',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        key: 'catalog.reader',
        name: 'Leitor de catalogo',
        description: 'Permite consultar perfis administraveis.',
        permissionKeys: ['roles.read'],
        companyIds: ['cmp_demo'],
        establishmentIds: ['est_demo_branch'],
        costCenterIds: [],
        status: 'active',
      },
    });

    expect(createRoleResponse.statusCode).toBe(201);

    const grantResponse = await server.inject({
      method: 'PUT',
      url: '/v1/governance/users/user_operator/scope-grants',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        companies: [
          {
            companyId: 'cmp_demo',
            establishmentIds: ['est_demo_branch'],
          },
        ],
        defaultCompanyId: 'cmp_demo',
        defaultEstablishmentId: 'est_demo_branch',
        readOnlyAllowed: false,
        roleKeys: ['catalog.reader'],
        permissionOverrides: [],
        justification: 'Delegacao de leitura do catalogo de perfis.',
      },
    });

    expect(grantResponse.statusCode).toBe(200);

    const rolesResponse = await server.inject({
      method: 'GET',
      url: '/v1/governance/roles?page=1&pageSize=20',
      headers: {
        authorization: 'Bearer token-operator',
      },
    });

    expect(rolesResponse.statusCode).toBe(200);
    expect(
      rolesResponse
        .json()
        .data.items.some((item: { key: string }) => item.key === 'catalog.reader'),
    ).toBe(true);
  });

  it('creates, validates, runs and lists FG-006 import jobs', async () => {
    const server = await createApp();

    const createResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/imports',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        entity: 'roles',
        format: 'csv',
        fileName: 'roles.csv',
        mode: 'upsert',
        content: [
          'key,name,permissionKeys,status',
          'finance.viewer,Financeiro leitura,roles.read|reporting.consolidated.read,active',
        ].join('\n'),
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().data.status).toBe('validated');

    const jobId = createResponse.json().data.id as string;
    const runResponse = await server.inject({
      method: 'POST',
      url: `/v1/governance/imports/${jobId}/run`,
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {},
    });

    expect(runResponse.statusCode).toBe(200);
    expect(runResponse.json().data.status).toBe('completed');

    const jobsResponse = await server.inject({
      method: 'GET',
      url: '/v1/governance/data-jobs?page=1&pageSize=20&type=import',
      headers: {
        authorization: 'Bearer token-admin',
      },
    });

    expect(jobsResponse.statusCode).toBe(200);
    expect(
      jobsResponse
        .json()
        .data.items.some((item: { id: string }) => item.id === jobId),
    ).toBe(true);
  });

  it('creates export jobs with sanitized output preview', async () => {
    const server = await createApp();

    const exportResponse = await server.inject({
      method: 'POST',
      url: '/v1/governance/exports',
      headers: {
        authorization: 'Bearer token-admin',
      },
      payload: {
        entity: 'settings',
        format: 'csv',
        fileName: 'settings.csv',
        filters: {
          moduleKey: 'governance',
        },
      },
    });

    expect(exportResponse.statusCode).toBe(201);
    expect(exportResponse.json().data.status).toBe('completed');
    expect(exportResponse.json().data.outputPreview).toContain('settingKey');
  });
});
