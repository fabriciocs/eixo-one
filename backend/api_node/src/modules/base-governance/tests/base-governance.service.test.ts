import { describe, expect, it } from 'vitest';

import { InMemoryAuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { BaseGovernanceService } from '../application/base-governance.service.js';
import { InMemoryBaseGovernanceRepository } from '../infrastructure/in-memory-base-governance.repository.js';

const admin = {
  uid: 'user_admin',
  tenantId: 'tenant_demo',
  roleKeys: ['platform_admin'],
  permissionKeys: ['roles.read', 'roles.manage', 'audit.read'],
  moduleKeys: ['dashboard', 'governance', 'roles', 'audit'],
};

const requestContext = {
  correlationId: 'corr-1234567890',
  requestId: 'req-1234567890',
  receivedAt: '2026-04-27T00:00:00.000Z',
};

describe('BaseGovernanceService', () => {
  it('creates roles with audit trail', async () => {
    const auditLogWriter = new InMemoryAuditLogWriter();
    const service = new BaseGovernanceService(
      new InMemoryBaseGovernanceRepository(auditLogWriter),
      auditLogWriter,
    );
    const role = await service.createRole(
      admin,
      {
        key: 'finance.viewer',
        name: 'Financeiro leitura',
        description: 'Consulta dados financeiros sem alterar cadastros.',
        permissionKeys: ['governance.company.read'],
        companyIds: ['cmp_demo'],
        establishmentIds: [],
        costCenterIds: [],
        status: 'active',
      },
      requestContext,
    );

    const audit = await service.listAuditEvents(admin, {
      entityType: 'role',
      entityId: role.roleId,
      page: 1,
      pageSize: 20,
    });

    expect(role.version).toBe(0);
    expect(audit.items).toHaveLength(1);
  });

  it('rejects unknown permission keys on role creation', async () => {
    const auditLogWriter = new InMemoryAuditLogWriter();
    const service = new BaseGovernanceService(
      new InMemoryBaseGovernanceRepository(auditLogWriter),
      auditLogWriter,
    );

    await expect(
      service.createRole(
        admin,
        {
          key: 'invalid.role',
          name: 'Perfil invalido',
          description: 'Usa permissao nao catalogada.',
          permissionKeys: ['unknown.permission'],
          companyIds: [],
          establishmentIds: [],
          costCenterIds: [],
          status: 'draft',
        },
        requestContext,
      ),
    ).rejects.toThrow('Existem permissoes desconhecidas');
  });

  it('validates optimistic concurrency on role updates', async () => {
    const auditLogWriter = new InMemoryAuditLogWriter();
    const service = new BaseGovernanceService(
      new InMemoryBaseGovernanceRepository(auditLogWriter),
      auditLogWriter,
    );
    const role = await service.createRole(
      admin,
      {
        key: 'ops.viewer',
        name: 'Operacoes leitura',
        description: 'Consulta operacoes basicas.',
        permissionKeys: ['governance.establishment.read'],
        companyIds: ['cmp_demo'],
        establishmentIds: [],
        costCenterIds: [],
        status: 'active',
      },
      requestContext,
    );

    await expect(
      service.updateRole(
        admin,
        role.roleId,
        {
          expectedVersion: 99,
          name: 'Operacoes leitura v2',
        },
        requestContext,
      ),
    ).rejects.toThrow('Versao do perfil desatualizada');
  });

  it('marks test recipients containing fail as failed before retrying', async () => {
    const auditLogWriter = new InMemoryAuditLogWriter();
    const service = new BaseGovernanceService(
      new InMemoryBaseGovernanceRepository(auditLogWriter),
      auditLogWriter,
    );

    const template = await service.createNotificationTemplate(
      admin,
      {
        key: 'notifications.manual.followup.email',
        moduleKey: 'notifications',
        label: 'Follow-up manual',
        channel: 'email',
        eventKey: 'manual.followup',
        subject: 'Pendencia em aberto',
        body: 'Ola {{customerName}}, existe uma pendencia para {{documentCode}}.',
        scopeType: 'TENANT',
        requiresConsent: true,
        allowAttachments: false,
        retryLimit: 2,
        status: 'active',
      },
      requestContext,
    );

    const delivery = await service.sendNotification(
      admin,
      {
        templateKey: template.key,
        recipient: 'fail@cliente.com',
        bodyVariables: {
          customerName: 'Cliente Demo',
          documentCode: 'DOC-102',
        },
        consentGranted: true,
        attachments: [],
        metadata: {},
      },
      requestContext,
    );

    expect(delivery.status).toBe('failed');
    expect(delivery.lastError).toContain('Falha simulada');
  });
});
