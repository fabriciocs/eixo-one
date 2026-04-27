import type {
  AuditEvent,
  BaseGovernanceRole,
  BaseGovernanceSetting,
  DataJob,
  SettingScopeType,
} from '@eixoone/shared-contracts';

import {
  baseGovernanceRoleSchema,
  baseGovernanceSettingSchema,
  dataJobSchema,
} from '@eixoone/shared-contracts';

import { InMemoryAuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { AppError } from '../../../core/errors/app-error.js';
import type {
  BaseGovernanceListResult,
  BaseGovernanceRepository,
  ListAuditFilters,
  ListDataJobsFilters,
  ListRolesFilters,
  ListSettingsFilters,
} from '../application/base-governance.repository.js';

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): BaseGovernanceListResult<T> {
  const startIndex = (page - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: pageItems,
    totalItems: items.length,
    hasNextPage: startIndex + pageSize < items.length,
    page,
    pageSize,
  };
}

function normalizeSearch(value?: string) {
  return value?.trim().toLowerCase();
}

const platformAdminRole = baseGovernanceRoleSchema.parse({
  roleId: 'role_platform_admin',
  tenantId: 'tenant_demo',
  key: 'platform_admin',
  name: 'Platform admin',
  description: 'Controle total da plataforma e do tenant de demonstracao.',
  permissionKeys: [
    'users.read',
    'users.manage',
    'roles.read',
    'roles.manage',
    'audit.read',
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
    'governance.consolidation.reprocess',
    'reporting.consolidated.read',
  ],
  companyIds: [],
  establishmentIds: [],
  costCenterIds: [],
  status: 'active',
  version: 1,
  createdAt: '2026-04-26T18:00:00.000Z',
  createdBy: 'system_seed',
});

const operatorRole = baseGovernanceRoleSchema.parse({
  roleId: 'role_operator',
  tenantId: 'tenant_demo',
  key: 'operator',
  name: 'Operador',
  description: 'Consulta governanca operacional e troca contexto permitido.',
  permissionKeys: [
    'users.read',
    'roles.read',
    'governance.company.read',
    'governance.establishment.read',
    'governance.context.switch',
    'reporting.consolidated.read',
  ],
  companyIds: ['cmp_demo'],
  establishmentIds: ['est_demo_branch'],
  costCenterIds: [],
  status: 'active',
  version: 1,
  createdAt: '2026-04-26T18:00:00.000Z',
  createdBy: 'system_seed',
});

const supervisorRole = baseGovernanceRoleSchema.parse({
  roleId: 'role_supervisor',
  tenantId: 'tenant_ops',
  key: 'supervisor',
  name: 'Supervisor',
  description: 'Supervisao operacional do tenant externo.',
  permissionKeys: [
    'users.read',
    'roles.read',
    'governance.company.read',
    'governance.establishment.read',
    'governance.context.switch',
    'reporting.consolidated.read',
  ],
  companyIds: ['cmp_ops'],
  establishmentIds: ['est_ops_matrix'],
  costCenterIds: [],
  status: 'active',
  version: 1,
  createdAt: '2026-04-26T18:00:00.000Z',
  createdBy: 'system_seed',
});

export class InMemoryBaseGovernanceRepository
  implements BaseGovernanceRepository
{
  private readonly roles = new Map<string, BaseGovernanceRole>(
    [platformAdminRole, operatorRole, supervisorRole].map((role) => [
      this.roleKey(role.tenantId, role.roleId),
      role,
    ]),
  );
  private readonly settings = new Map<string, BaseGovernanceSetting>(
    seedSettings.map((setting) => [
      this.settingStorageKey({
        tenantId: setting.tenantId,
        settingKey: setting.settingKey,
        scopeType: setting.scopeType,
        companyId: setting.companyId,
        establishmentId: setting.establishmentId,
      }),
      setting,
    ]),
  );
  private readonly dataJobs = new Map<string, DataJob>(
    seedDataJobs.map((job) => [this.dataJobKey(job.tenantId, job.id), job]),
  );

  constructor(private readonly auditLogWriter?: InMemoryAuditLogWriter) {}

  private roleKey(tenantId: string, roleId: string) {
    return `${tenantId}:${roleId}`;
  }

  private settingStorageKey(input: {
    tenantId: string;
    settingKey: string;
    scopeType: SettingScopeType;
    companyId?: string;
    establishmentId?: string;
  }) {
    return [
      input.tenantId,
      input.settingKey,
      input.scopeType,
      input.companyId ?? '_',
      input.establishmentId ?? '_',
    ].join(':');
  }

  private dataJobKey(tenantId: string, jobId: string) {
    return `${tenantId}:${jobId}`;
  }

  async listRoles(
    tenantId: string,
    filters: ListRolesFilters,
  ): Promise<BaseGovernanceListResult<BaseGovernanceRole>> {
    const normalizedSearch = normalizeSearch(filters.search);
    const filteredRoles = [...this.roles.values()]
      .filter((role) => role.tenantId === tenantId)
      .filter((role) => !filters.status || role.status === filters.status)
      .filter((role) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          role.name.toLowerCase().includes(normalizedSearch) ||
          role.key.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name));

    return paginate(filteredRoles, filters.page, filters.pageSize);
  }

  async findRoleById(tenantId: string, roleId: string) {
    return this.roles.get(this.roleKey(tenantId, roleId)) ?? null;
  }

  async findRoleByKey(tenantId: string, key: string) {
    return (
      [...this.roles.values()].find(
        (role) => role.tenantId === tenantId && role.key === key,
      ) ?? null
    );
  }

  async listRolesByKeys(tenantId: string, roleKeys: string[]) {
    const keys = new Set(roleKeys);
    return [...this.roles.values()].filter(
      (role) => role.tenantId === tenantId && keys.has(role.key),
    );
  }

  async createRole(role: BaseGovernanceRole) {
    this.roles.set(this.roleKey(role.tenantId, role.roleId), role);
    return role;
  }

  async updateRole(input: {
    tenantId: string;
    roleId: string;
    expectedVersion: number;
    role: BaseGovernanceRole;
  }) {
    this.roles.set(this.roleKey(input.tenantId, input.roleId), input.role);
    return input.role;
  }

  async listSettings(
    tenantId: string,
    filters: ListSettingsFilters,
  ): Promise<BaseGovernanceListResult<BaseGovernanceSetting>> {
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const settings = [...this.settings.values()]
      .filter((setting) => setting.tenantId === tenantId)
      .filter((setting) => !filters.moduleKey || setting.moduleKey === filters.moduleKey)
      .filter((setting) => !filters.scopeType || setting.scopeType === filters.scopeType)
      .filter(
        (setting) =>
          filters.sensitive === undefined || setting.sensitive === filters.sensitive,
      )
      .filter((setting) => !filters.status || setting.status === filters.status)
      .filter((setting) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          setting.settingKey,
          setting.label,
          setting.description ?? '',
          setting.moduleKey,
          setting.category,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    return paginate(settings, filters.page, filters.pageSize);
  }

  async findSetting(input: {
    tenantId: string;
    settingKey: string;
    scopeType: SettingScopeType;
    companyId?: string;
    establishmentId?: string;
  }) {
    return (
      this.settings.get(
        this.settingStorageKey({
          tenantId: input.tenantId,
          settingKey: input.settingKey,
          scopeType: input.scopeType,
          companyId: input.companyId,
          establishmentId: input.establishmentId,
        }),
      ) ?? null
    );
  }

  async upsertSetting(input: {
    tenantId: string;
    settingKey: string;
    scopeType: SettingScopeType;
    companyId?: string;
    establishmentId?: string;
    expectedVersion: number;
    setting: BaseGovernanceSetting;
  }) {
    const storageKey = this.settingStorageKey(input);
    const currentSetting = this.settings.get(storageKey);

    if (currentSetting && currentSetting.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao da configuracao desatualizada. Recarregue os dados.',
      );
    }

    const parsedSetting =
      baseGovernanceSettingSchema.parse(input.setting) as BaseGovernanceSetting;
    this.settings.set(storageKey, parsedSetting);
    return parsedSetting;
  }

  async listAudit(
    tenantId: string,
    filters: ListAuditFilters,
  ): Promise<BaseGovernanceListResult<AuditEvent>> {
    const events = (this.auditLogWriter?.events ?? [])
      .filter((event) => event.tenantId === tenantId)
      .filter(
        (event) => !filters.entityType || event.entityType === filters.entityType,
      )
      .filter(
        (event) => !filters.entityId || event.entityId === filters.entityId,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return paginate(events, filters.page, filters.pageSize);
  }

  async listDataJobs(
    tenantId: string,
    filters: ListDataJobsFilters,
  ): Promise<BaseGovernanceListResult<DataJob>> {
    const normalizedSearch = normalizeSearch(filters.search);
    const jobs = [...this.dataJobs.values()]
      .filter((job) => job.tenantId === tenantId)
      .filter((job) => !filters.entity || job.entity === filters.entity)
      .filter((job) => !filters.type || job.type === filters.type)
      .filter((job) => !filters.status || job.status === filters.status)
      .filter((job) => {
        if (!normalizedSearch) {
          return true;
        }

        return [job.fileName, job.entity, job.type, job.status]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return paginate(jobs, filters.page, filters.pageSize);
  }

  async findDataJobById(tenantId: string, jobId: string) {
    return this.dataJobs.get(this.dataJobKey(tenantId, jobId)) ?? null;
  }

  async createDataJob(job: DataJob) {
    const parsedJob = dataJobSchema.parse(job) as DataJob;
    this.dataJobs.set(this.dataJobKey(parsedJob.tenantId, parsedJob.id), parsedJob);
    return parsedJob;
  }

  async saveDataJob(job: DataJob) {
    const parsedJob = dataJobSchema.parse(job) as DataJob;
    this.dataJobs.set(this.dataJobKey(parsedJob.tenantId, parsedJob.id), parsedJob);
    return parsedJob;
  }

  async isReady() {
    return true;
  }
}

const seedSettings = [
  baseGovernanceSettingSchema.parse({
    settingKey: 'governance.numbering.invoice_series',
    tenantId: 'tenant_demo',
    moduleKey: 'governance',
    category: 'numbering',
    label: 'Serie de faturamento',
    description: 'Prefixo e numeracao padrao dos documentos de faturamento.',
    scopeType: 'COMPANY',
    companyId: 'cmp_demo',
    valueType: 'json',
    value: {
      prefix: 'NF',
      nextNumber: 1824,
    },
    defaultValue: {
      prefix: 'NF',
      nextNumber: 1000,
    },
    sensitive: false,
    status: 'active',
    version: 3,
    createdAt: '2026-04-26T18:10:00.000Z',
    createdBy: 'system_seed',
    updatedAt: '2026-04-26T18:22:00.000Z',
    updatedBy: 'user_admin',
  }),
  baseGovernanceSettingSchema.parse({
    settingKey: 'notifications.email.invoice_template',
    tenantId: 'tenant_demo',
    moduleKey: 'notifications',
    category: 'templates',
    label: 'Template de e-mail de faturamento',
    description: 'Assunto e corpo utilizados no envio padrao de documentos.',
    scopeType: 'TENANT',
    valueType: 'json',
    value: {
      subject: 'Documento fiscal disponivel',
      body: 'Acesse o portal para consultar seu documento.',
    },
    defaultValue: {
      subject: 'Documento disponivel',
      body: 'Seu documento ja pode ser consultado no portal.',
    },
    sensitive: false,
    status: 'active',
    version: 1,
    createdAt: '2026-04-26T18:12:00.000Z',
    createdBy: 'system_seed',
    updatedAt: '2026-04-26T18:18:00.000Z',
    updatedBy: 'user_admin',
  }),
  baseGovernanceSettingSchema.parse({
    settingKey: 'governance.approvals.require_second_reviewer',
    tenantId: 'tenant_demo',
    moduleKey: 'governance',
    category: 'policy',
    label: 'Exigir segundo aprovador',
    description: 'Ativa dupla revisao para alteracoes administrativas sensiveis.',
    scopeType: 'TENANT',
    valueType: 'boolean',
    value: true,
    defaultValue: true,
    sensitive: false,
    status: 'active',
    version: 0,
    createdAt: '2026-04-26T18:15:00.000Z',
    createdBy: 'system_seed',
  }),
] as const satisfies readonly BaseGovernanceSetting[];

const seedDataJobs = [
  dataJobSchema.parse({
    id: 'job_seed_roles_export',
    tenantId: 'tenant_demo',
    type: 'export',
    entity: 'roles',
    format: 'csv',
    status: 'completed',
    fileName: 'roles-seed.csv',
    filters: {},
    totalRows: 2,
    validRows: 2,
    invalidRows: 0,
    errors: [],
    previewRows: [
      {
        rowNumber: 1,
        values: {
          key: 'platform_admin',
          name: 'Platform admin',
        },
        valid: true,
      },
    ],
    outputPreview: 'key,name\r\nplatform_admin,Platform admin',
    createdBy: 'system_seed',
    createdAt: '2026-04-26T18:30:00.000Z',
    completedAt: '2026-04-26T18:30:02.000Z',
  }),
] as const satisfies readonly DataJob[];
