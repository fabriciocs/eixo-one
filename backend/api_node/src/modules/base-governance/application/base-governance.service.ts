import crypto from 'node:crypto';

import {
  auditEventSchema,
  baseGovernanceRoleSchema,
  baseGovernanceSettingSchema,
  contractVersion,
  type AuditEvent,
  type BaseGovernanceRole,
  type BaseGovernanceSetting,
  type CreateExportJobRequest,
  type CreateImportJobRequest,
  type CreateRoleRequest,
  dataJobSchema,
  type DataJob,
  type DataJobEntity,
  type DataJobError,
  type DataJobMappingEntry,
  type DataJobPreviewRow,
  type ListDataJobsQuery,
  type ListAuditEventsQuery,
  type ListRolesQuery,
  type ListSettingsQuery,
  type PermissionCatalogEntry,
  type ResetSettingRequest,
  type RunImportJobRequest,
  type SettingScopeType,
  type SettingValue,
  type SettingValueType,
  type UpdateRoleRequest,
  type UpdateSettingRequest,
} from '@eixoone/shared-contracts';

import type { AuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { AppError } from '../../../core/errors/app-error.js';
import type {
  AuthContext,
  RequestContextData,
} from '../../../middlewares/request-types.js';
import {
  isKnownPermissionKey,
  permissionCatalog,
} from '../domain/base-governance-permissions.js';
import type {
  BaseGovernanceRepository,
  ListAuditFilters,
  ListDataJobsFilters,
  ListRolesFilters,
  ListSettingsFilters,
} from './base-governance.repository.js';

function normalizeSearch(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized.toLowerCase() : undefined;
}

function normalizeStringList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function generateRoleId() {
  return `role_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`;
}

function generateDataJobId() {
  return `job_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

type SettingDefinition = {
  settingKey: string;
  moduleKey: string;
  category: string;
  label: string;
  description: string;
  valueType: SettingValueType;
  defaultValue: SettingValue;
  sensitive: boolean;
  allowedScopes: SettingScopeType[];
};

const settingDefinitions: readonly SettingDefinition[] = [
  {
    settingKey: 'governance.numbering.invoice_series',
    moduleKey: 'governance',
    category: 'numbering',
    label: 'Serie de faturamento',
    description: 'Controla prefixo e proximo numero da numeracao padrao.',
    valueType: 'json',
    defaultValue: {
      prefix: 'NF',
      nextNumber: 1000,
    },
    sensitive: false,
    allowedScopes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    settingKey: 'notifications.email.invoice_template',
    moduleKey: 'notifications',
    category: 'templates',
    label: 'Template de e-mail de faturamento',
    description: 'Assunto e corpo padrao usados em envios operacionais.',
    valueType: 'json',
    defaultValue: {
      subject: 'Documento disponivel',
      body: 'Seu documento ja pode ser consultado no portal.',
    },
    sensitive: false,
    allowedScopes: ['TENANT', 'COMPANY'],
  },
  {
    settingKey: 'governance.approvals.require_second_reviewer',
    moduleKey: 'governance',
    category: 'policy',
    label: 'Exigir segundo aprovador',
    description: 'Liga a revisao adicional para alteracoes administrativas.',
    valueType: 'boolean',
    defaultValue: true,
    sensitive: false,
    allowedScopes: ['TENANT'],
  },
  {
    settingKey: 'sales.default_quote_validity_days',
    moduleKey: 'sales',
    category: 'defaults',
    label: 'Validade padrao de propostas',
    description: 'Numero de dias adotado por padrao ao gerar propostas.',
    valueType: 'number',
    defaultValue: 7,
    sensitive: false,
    allowedScopes: ['TENANT', 'COMPANY'],
  },
];

const settingDefinitionsMap = new Map(
  settingDefinitions.map((definition) => [definition.settingKey, definition]),
);

type ParsedTabularData = {
  headers: string[];
  rows: Record<string, string>[];
};

const importEntityFields: Record<DataJobEntity, string[]> = {
  roles: [
    'key',
    'name',
    'description',
    'status',
    'permissionKeys',
    'companyIds',
    'establishmentIds',
    'costCenterIds',
  ],
  settings: [
    'settingKey',
    'scopeType',
    'companyId',
    'establishmentId',
    'value',
  ],
  customers: [],
  audit: [],
  privacy_requests: [],
};

export class BaseGovernanceService {
  constructor(
    private readonly repository: BaseGovernanceRepository,
    private readonly auditLogWriter: AuditLogWriter,
  ) {}

  private validatePermissionKeys(permissionKeys: string[]) {
    const unknown = permissionKeys.filter(
      (permissionKey) => !isKnownPermissionKey(permissionKey),
    );

    if (unknown.length > 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Existem permissoes desconhecidas neste perfil.',
        unknown.map((permissionKey) => ({
          field: 'permissionKeys',
          message: `Permissao desconhecida: ${permissionKey}.`,
        })),
      );
    }
  }

  private sanitizeExportValue(value: unknown) {
    const stringValue =
      typeof value === 'string'
        ? value
        : typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : `${value ?? ''}`;

    if (/^[=+\-@]/.test(stringValue)) {
      return `'${stringValue}`;
    }

    return stringValue;
  }

  private parseCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"') {
        if (insideQuotes && nextCharacter === '"') {
          current += '"';
          index += 1;
          continue;
        }

        insideQuotes = !insideQuotes;
        continue;
      }

      if (character === ',' && !insideQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += character;
    }

    values.push(current.trim());
    return values;
  }

  private parseTabularContent(content: string): ParsedTabularData {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'A importacao precisa conter cabecalho e pelo menos uma linha.',
      );
    }

    const headers = this.parseCsvLine(lines[0] ?? '').map((header) => header.trim());
    const rows = lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      return Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? '']),
      );
    });

    return {
      headers,
      rows,
    };
  }

  private normalizeMapping(
    headers: string[],
    mapping: DataJobMappingEntry[],
    entity: DataJobEntity,
  ) {
    if (mapping.length > 0) {
      return mapping;
    }

    const knownFields = new Set(importEntityFields[entity] ?? []);
    return headers
      .filter((header) => knownFields.has(header))
      .map((header) => ({
        sourceColumn: header,
        targetField: header,
        required: ['key', 'name', 'permissionKeys', 'settingKey', 'scopeType', 'value'].includes(
          header,
        ),
      }));
  }

  private mapRows(
    rows: Record<string, string>[],
    mapping: DataJobMappingEntry[],
  ): Record<string, string>[] {
    return rows.map((row) =>
      Object.fromEntries(
        mapping.map((entry) => [entry.targetField, row[entry.sourceColumn] ?? '']),
      ),
    );
  }

  private splitListValue(value?: string) {
    return [...new Set((value ?? '')
      .split(/[|;,]/)
      .map((item) => item.trim())
      .filter(Boolean))].sort();
  }

  private validateImportRows(input: {
    entity: DataJobEntity;
    rows: Record<string, string>[];
    mapping: DataJobMappingEntry[];
  }) {
    const errors: DataJobError[] = [];
    const previewRows: DataJobPreviewRow[] = [];

    input.rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors: DataJobError[] = [];

      for (const entry of input.mapping.filter((item) => item.required)) {
        if (!(row[entry.targetField] ?? '').trim()) {
          rowErrors.push({
            row: rowNumber,
            field: entry.targetField,
            message: `Campo obrigatorio sem valor: ${entry.targetField}.`,
          });
        }
      }

      if (input.entity === 'roles') {
        if ((row.permissionKeys ?? '').trim().length === 0) {
          rowErrors.push({
            row: rowNumber,
            field: 'permissionKeys',
            message: 'Informe ao menos uma permissao por linha.',
          });
        }

        const status = (row.status ?? 'draft').trim();
        if (status && !['draft', 'active', 'inactive'].includes(status)) {
          rowErrors.push({
            row: rowNumber,
            field: 'status',
            message: 'Status de perfil invalido.',
          });
        }
      }

      if (input.entity === 'settings') {
        const scopeType = (row.scopeType ?? '').trim();
        if (
          scopeType &&
          !['TENANT', 'COMPANY', 'ESTABLISHMENT'].includes(scopeType)
        ) {
          rowErrors.push({
            row: rowNumber,
            field: 'scopeType',
            message: 'Escopo de configuracao invalido.',
          });
        }

        if (
          (scopeType === 'COMPANY' || scopeType === 'ESTABLISHMENT') &&
          !(row.companyId ?? '').trim()
        ) {
          rowErrors.push({
            row: rowNumber,
            field: 'companyId',
            message: 'companyId obrigatorio para o escopo informado.',
          });
        }

        if (scopeType === 'ESTABLISHMENT' && !(row.establishmentId ?? '').trim()) {
          rowErrors.push({
            row: rowNumber,
            field: 'establishmentId',
            message: 'establishmentId obrigatorio para o escopo ESTABLISHMENT.',
          });
        }
      }

      previewRows.push({
        rowNumber,
        values: Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, value ?? '']),
        ),
        valid: rowErrors.length === 0,
      });
      errors.push(...rowErrors);
    });

    return {
      errors,
      previewRows: previewRows.slice(0, 20),
    };
  }

  private assertSupportedImportEntity(entity: DataJobEntity) {
    if (!['roles', 'settings'].includes(entity)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'O MVP atual suporta importacao apenas para roles e settings.',
      );
    }
  }

  private assertSupportedExportEntity(entity: DataJobEntity) {
    if (!['roles', 'settings', 'audit'].includes(entity)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'O MVP atual suporta exportacao apenas para roles, settings e audit.',
      );
    }
  }

  private requireSettingDefinition(settingKey: string) {
    const definition = settingDefinitionsMap.get(settingKey);

    if (!definition) {
      throw new AppError(
        404,
        'NOT_FOUND',
        'Configuracao administrativa nao encontrada.',
      );
    }

    return definition;
  }

  private validateSettingScope(
    definition: SettingDefinition,
    scopeType: SettingScopeType,
  ) {
    if (!definition.allowedScopes.includes(scopeType)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'O escopo informado nao e suportado para esta configuracao.',
        [
          {
            field: 'scopeType',
            message: `Escopo permitido: ${definition.allowedScopes.join(', ')}.`,
          },
        ],
      );
    }
  }

  private validateSettingValue(
    definition: SettingDefinition,
    value: SettingValue,
  ) {
    const actualType = Array.isArray(value)
      ? 'array'
      : value === null
      ? 'null'
      : typeof value;

    const expectedType = definition.valueType;
    const invalid =
      (expectedType === 'string' && typeof value !== 'string') ||
      (expectedType === 'number' && typeof value !== 'number') ||
      (expectedType === 'boolean' && typeof value !== 'boolean') ||
      (expectedType === 'json' &&
        (typeof value !== 'object' || value === null || Array.isArray(value)));

    if (invalid) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'O valor informado nao corresponde ao tipo esperado da configuracao.',
        [
          {
            field: 'value',
            message: `Esperado ${expectedType}, recebido ${actualType}.`,
          },
        ],
      );
    }
  }

  private sanitizeSettingValueForAudit(
    definition: SettingDefinition,
    value: SettingValue,
  ) {
    if (!definition.sensitive) {
      return value;
    }

    return '[REDACTED]';
  }

  private async validateRoleUniqueness(input: {
    tenantId: string;
    key: string;
    ignoreRoleId?: string;
  }) {
    const existingRole = await this.repository.findRoleByKey(
      input.tenantId,
      input.key,
    );

    if (existingRole && existingRole.roleId !== input.ignoreRoleId) {
      throw new AppError(
        409,
        'DUPLICATE_RECORD',
        'Ja existe um perfil com esta chave neste tenant.',
      );
    }
  }

  private buildRole(input: {
    auth: AuthContext;
    currentRole?: BaseGovernanceRole;
    payload: CreateRoleRequest | Omit<UpdateRoleRequest, 'expectedVersion'>;
  }) {
    const now = new Date().toISOString();
    const currentRole = input.currentRole;
    const role = baseGovernanceRoleSchema.parse({
      roleId: currentRole?.roleId ?? generateRoleId(),
      tenantId: input.auth.tenantId,
      key: input.payload.key ?? currentRole?.key,
      name: input.payload.name ?? currentRole?.name,
      description:
        input.payload.description === undefined
          ? currentRole?.description ?? null
          : input.payload.description,
      permissionKeys: normalizeStringList(
        input.payload.permissionKeys ?? currentRole?.permissionKeys ?? [],
      ),
      companyIds: normalizeStringList(
        input.payload.companyIds ?? currentRole?.companyIds ?? [],
      ),
      establishmentIds: normalizeStringList(
        input.payload.establishmentIds ?? currentRole?.establishmentIds ?? [],
      ),
      costCenterIds: normalizeStringList(
        input.payload.costCenterIds ?? currentRole?.costCenterIds ?? [],
      ),
      status: input.payload.status ?? currentRole?.status ?? 'draft',
      version: currentRole?.version ?? 0,
      createdAt: currentRole?.createdAt ?? now,
      createdBy: currentRole?.createdBy ?? input.auth.uid,
      updatedAt: currentRole ? now : undefined,
      updatedBy: currentRole ? input.auth.uid : undefined,
    });

    this.validatePermissionKeys(role.permissionKeys);
    return role;
  }

  private async writeAuditEvent(input: {
    auth: AuthContext;
    context: RequestContextData;
    action: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    const event: AuditEvent = auditEventSchema.parse({
      contractVersion,
      tenantId: input.auth.tenantId,
      actorUserId: input.auth.uid,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      severity: 'info',
      correlationId: input.context.correlationId,
      requestId: input.context.requestId,
      before: input.before,
      after: input.after,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    });

    await this.auditLogWriter.write(event);
  }

  async listRoles(auth: AuthContext, query: ListRolesQuery) {
    const filters: ListRolesFilters = {
      search: normalizeSearch(query.search),
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    };

    return this.repository.listRoles(auth.tenantId, filters);
  }

  async createRole(
    auth: AuthContext,
    payload: CreateRoleRequest,
    context: RequestContextData,
  ) {
    await this.validateRoleUniqueness({
      tenantId: auth.tenantId,
      key: payload.key,
    });

    const role = this.buildRole({ auth, payload });
    const savedRole = await this.repository.createRole(role);

    await this.writeAuditEvent({
      auth,
      context,
      action: 'role.created',
      entityType: 'role',
      entityId: savedRole.roleId,
      after: {
        key: savedRole.key,
        status: savedRole.status,
        permissionKeys: savedRole.permissionKeys,
      },
    });

    return savedRole;
  }

  async updateRole(
    auth: AuthContext,
    roleId: string,
    payload: UpdateRoleRequest,
    context: RequestContextData,
  ) {
    const currentRole = await this.repository.findRoleById(auth.tenantId, roleId);
    if (!currentRole) {
      throw new AppError(404, 'NOT_FOUND', 'Perfil nao encontrado.');
    }

    if (currentRole.version !== payload.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao do perfil desatualizada. Recarregue os dados.',
      );
    }

    await this.validateRoleUniqueness({
      tenantId: auth.tenantId,
      key: payload.key ?? currentRole.key,
      ignoreRoleId: currentRole.roleId,
    });

    const nextRole = this.buildRole({
      auth,
      currentRole,
      payload,
    });
    const savedRole = await this.repository.updateRole({
      tenantId: auth.tenantId,
      roleId,
      expectedVersion: payload.expectedVersion,
      role: {
        ...nextRole,
        version: currentRole.version + 1,
      },
    });

    await this.writeAuditEvent({
      auth,
      context,
      action: 'role.updated',
      entityType: 'role',
      entityId: savedRole.roleId,
      before: {
        key: currentRole.key,
        status: currentRole.status,
        permissionKeys: currentRole.permissionKeys,
      },
      after: {
        key: savedRole.key,
        status: savedRole.status,
        permissionKeys: savedRole.permissionKeys,
      },
    });

    return savedRole;
  }

  async listPermissionCatalog(auth: AuthContext) {
    return permissionCatalog satisfies PermissionCatalogEntry[];
  }

  async listSettings(auth: AuthContext, query: ListSettingsQuery) {
    const filters: ListSettingsFilters = {
      search: normalizeSearch(query.search),
      moduleKey: query.moduleKey?.trim(),
      scopeType: query.scopeType,
      sensitive: query.sensitive,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    };

    return this.repository.listSettings(auth.tenantId, filters);
  }

  async updateSetting(
    auth: AuthContext,
    settingKey: string,
    payload: UpdateSettingRequest,
    context: RequestContextData,
  ) {
    const definition = this.requireSettingDefinition(settingKey);
    this.validateSettingScope(definition, payload.scopeType);
    this.validateSettingValue(definition, payload.value);

    const currentSetting = await this.repository.findSetting({
      tenantId: auth.tenantId,
      settingKey,
      scopeType: payload.scopeType,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
    });

    if (currentSetting && currentSetting.version !== payload.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao da configuracao desatualizada. Recarregue os dados.',
      );
    }

    const now = new Date().toISOString();
    const nextSetting = baseGovernanceSettingSchema.parse({
      settingKey,
      tenantId: auth.tenantId,
      moduleKey: definition.moduleKey,
      category: definition.category,
      label: definition.label,
      description: definition.description,
      scopeType: payload.scopeType,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
      valueType: definition.valueType,
      value: payload.value,
      defaultValue: definition.defaultValue,
      sensitive: definition.sensitive,
      status: currentSetting?.status ?? 'active',
      version: currentSetting ? currentSetting.version + 1 : 0,
      createdAt: currentSetting?.createdAt ?? now,
      createdBy: currentSetting?.createdBy ?? auth.uid,
      updatedAt: currentSetting ? now : undefined,
      updatedBy: currentSetting ? auth.uid : undefined,
    }) as BaseGovernanceSetting;

    const savedSetting = await this.repository.upsertSetting({
      tenantId: auth.tenantId,
      settingKey,
      scopeType: payload.scopeType,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
      expectedVersion: payload.expectedVersion,
      setting: nextSetting,
    });

    await this.writeAuditEvent({
      auth,
      context,
      action: currentSetting ? 'setting.updated' : 'setting.created',
      entityType: 'setting',
      entityId: savedSetting.settingKey,
      before: currentSetting
        ? {
            scopeType: currentSetting.scopeType,
            value: this.sanitizeSettingValueForAudit(
              definition,
              currentSetting.value,
            ),
            version: currentSetting.version,
          }
        : undefined,
      after: {
        scopeType: savedSetting.scopeType,
        value: this.sanitizeSettingValueForAudit(definition, savedSetting.value),
        version: savedSetting.version,
      },
      metadata: {
        moduleKey: savedSetting.moduleKey,
        companyId: savedSetting.companyId,
        establishmentId: savedSetting.establishmentId,
      },
    });

    return savedSetting;
  }

  async resetSetting(
    auth: AuthContext,
    settingKey: string,
    payload: ResetSettingRequest,
    context: RequestContextData,
  ) {
    const definition = this.requireSettingDefinition(settingKey);
    this.validateSettingScope(definition, payload.scopeType);

    const currentSetting = await this.repository.findSetting({
      tenantId: auth.tenantId,
      settingKey,
      scopeType: payload.scopeType,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
    });

    if (!currentSetting) {
      throw new AppError(404, 'NOT_FOUND', 'Configuracao nao encontrada.');
    }

    if (currentSetting.version !== payload.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao da configuracao desatualizada. Recarregue os dados.',
      );
    }

    const nextSetting = baseGovernanceSettingSchema.parse({
      ...currentSetting,
      value: definition.defaultValue,
      version: currentSetting.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.uid,
    }) as BaseGovernanceSetting;

    const savedSetting = await this.repository.upsertSetting({
      tenantId: auth.tenantId,
      settingKey,
      scopeType: payload.scopeType,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
      expectedVersion: payload.expectedVersion,
      setting: nextSetting,
    });

    await this.writeAuditEvent({
      auth,
      context,
      action: 'setting.reset',
      entityType: 'setting',
      entityId: savedSetting.settingKey,
      before: {
        scopeType: currentSetting.scopeType,
        value: this.sanitizeSettingValueForAudit(
          definition,
          currentSetting.value,
        ),
        version: currentSetting.version,
      },
      after: {
        scopeType: savedSetting.scopeType,
        value: this.sanitizeSettingValueForAudit(definition, savedSetting.value),
        version: savedSetting.version,
      },
      metadata: {
        moduleKey: savedSetting.moduleKey,
        resetToDefault: true,
      },
    });

    return savedSetting;
  }

  async listAuditEvents(auth: AuthContext, query: ListAuditEventsQuery) {
    const filters: ListAuditFilters = {
      entityType: query.entityType,
      entityId: query.entityId,
      page: query.page,
      pageSize: query.pageSize,
    };

    return this.repository.listAudit(auth.tenantId, filters);
  }

  async listDataJobs(auth: AuthContext, query: ListDataJobsQuery) {
    const filters: ListDataJobsFilters = {
      search: normalizeSearch(query.search),
      entity: query.entity,
      type: query.type,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    };

    return this.repository.listDataJobs(auth.tenantId, filters);
  }

  async createImportJob(
    auth: AuthContext,
    payload: CreateImportJobRequest,
    context: RequestContextData,
  ) {
    this.assertSupportedImportEntity(payload.entity);
    const parsed = this.parseTabularContent(payload.content);
    const mapping = this.normalizeMapping(parsed.headers, payload.mapping, payload.entity);
    const mappedRows = this.mapRows(parsed.rows, mapping);
    const validation = this.validateImportRows({
      entity: payload.entity,
      rows: mappedRows,
      mapping,
    });
    const now = new Date().toISOString();

    const job = dataJobSchema.parse({
      id: generateDataJobId(),
      tenantId: auth.tenantId,
      type: 'import',
      entity: payload.entity,
      format: payload.format,
      status: validation.errors.length === 0 ? 'validated' : 'failed',
      fileName: payload.fileName,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
      mode: payload.mode,
      mapping,
      filters: {},
      totalRows: mappedRows.length,
      validRows: mappedRows.length - validation.errors.length,
      invalidRows: validation.errors.length,
      errors: validation.errors,
      previewRows: validation.previewRows,
      createdBy: auth.uid,
      createdAt: now,
      updatedAt: now,
    }) as DataJob;

    const savedJob = await this.repository.createDataJob(job);
    await this.writeAuditEvent({
      auth,
      context,
      action: 'data_job.created',
      entityType: 'data_job',
      entityId: savedJob.id,
      after: {
        type: savedJob.type,
        entity: savedJob.entity,
        status: savedJob.status,
        totalRows: savedJob.totalRows,
      },
      metadata: {
        fileName: savedJob.fileName,
        format: savedJob.format,
      },
    });

    return savedJob;
  }

  async runImportJob(
    auth: AuthContext,
    jobId: string,
    _payload: RunImportJobRequest,
    context: RequestContextData,
  ) {
    const currentJob = await this.repository.findDataJobById(auth.tenantId, jobId);
    if (!currentJob || currentJob.type !== 'import') {
      throw new AppError(404, 'NOT_FOUND', 'Job de importacao nao encontrado.');
    }

    if (currentJob.errors.length > 0 || currentJob.status === 'failed') {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Corrija os erros de validacao antes de executar o job.',
      );
    }

    const processingJob = await this.repository.saveDataJob({
      ...currentJob,
      status: 'processing',
      updatedAt: new Date().toISOString(),
    });

    const reconstructedRows = processingJob.previewRows.map((row) => row.values);

    if (processingJob.entity === 'roles') {
      for (const row of reconstructedRows) {
        const currentRole = await this.repository.findRoleByKey(auth.tenantId, row.key);
        if (currentRole) {
          await this.updateRole(
            auth,
            currentRole.roleId,
            {
              expectedVersion: currentRole.version,
              key: row.key,
              name: row.name,
              description: row.description || undefined,
              permissionKeys: this.splitListValue(row.permissionKeys),
              companyIds: this.splitListValue(row.companyIds),
              establishmentIds: this.splitListValue(row.establishmentIds),
              costCenterIds: this.splitListValue(row.costCenterIds),
              status: (row.status || currentRole.status) as UpdateRoleRequest['status'],
            },
            context,
          );
          continue;
        }

        await this.createRole(
          auth,
          {
            key: row.key,
            name: row.name,
            description: row.description || undefined,
            permissionKeys: this.splitListValue(row.permissionKeys),
            companyIds: this.splitListValue(row.companyIds),
            establishmentIds: this.splitListValue(row.establishmentIds),
            costCenterIds: this.splitListValue(row.costCenterIds),
            status: (row.status || 'draft') as CreateRoleRequest['status'],
          },
          context,
        );
      }
    }

    if (processingJob.entity === 'settings') {
      for (const row of reconstructedRows) {
        const definition = this.requireSettingDefinition(row.settingKey);
        const rawValue = row.value ?? '';
        let parsedValue: SettingValue;

        if (definition.valueType === 'json') {
          parsedValue = JSON.parse(rawValue);
        } else if (definition.valueType === 'boolean') {
          parsedValue = rawValue.trim().toLowerCase() === 'true';
        } else if (definition.valueType === 'number') {
          parsedValue = Number(rawValue);
        } else {
          parsedValue = rawValue;
        }

        const currentSetting = await this.repository.findSetting({
          tenantId: auth.tenantId,
          settingKey: row.settingKey,
          scopeType: row.scopeType as SettingScopeType,
          companyId: row.companyId || undefined,
          establishmentId: row.establishmentId || undefined,
        });

        await this.updateSetting(
          auth,
          row.settingKey,
          {
            scopeType: row.scopeType as SettingScopeType,
            companyId: row.companyId || undefined,
            establishmentId: row.establishmentId || undefined,
            value: parsedValue,
            expectedVersion: currentSetting?.version ?? 0,
          },
          context,
        );
      }
    }

    const completedJob = await this.repository.saveDataJob({
      ...processingJob,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.writeAuditEvent({
      auth,
      context,
      action: 'data_job.completed',
      entityType: 'data_job',
      entityId: completedJob.id,
      before: {
        status: currentJob.status,
      },
      after: {
        status: completedJob.status,
        validRows: completedJob.validRows,
      },
      metadata: {
        entity: completedJob.entity,
      },
    });

    return completedJob;
  }

  async createExportJob(
    auth: AuthContext,
    payload: CreateExportJobRequest,
    context: RequestContextData,
  ) {
    this.assertSupportedExportEntity(payload.entity);

    let rows: Record<string, unknown>[] = [];
    if (payload.entity === 'roles') {
      rows = (await this.repository.listRoles(auth.tenantId, {
        page: 1,
        pageSize: 200,
      })).items.map((role) => ({
        key: role.key,
        name: role.name,
        status: role.status,
        permissionKeys: role.permissionKeys.join('|'),
      }));
    }

    if (payload.entity === 'settings') {
      rows = (await this.repository.listSettings(auth.tenantId, {
        page: 1,
        pageSize: 200,
      })).items.map((setting) => ({
        settingKey: setting.settingKey,
        scopeType: setting.scopeType,
        moduleKey: setting.moduleKey,
        value: this.sanitizeExportValue(setting.value),
      }));
    }

    if (payload.entity === 'audit') {
      rows = (await this.repository.listAudit(auth.tenantId, {
        page: 1,
        pageSize: 200,
      })).items.map((event) => ({
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        createdAt: event.createdAt,
      }));
    }

    const headers = Object.keys(rows[0] ?? {});
    const outputPreview = [
      headers.join(','),
      ...rows.slice(0, 20).map((row) =>
        headers
          .map((header) => this.sanitizeExportValue(row[header]))
          .join(','),
      ),
    ].join('\r\n');
    const now = new Date().toISOString();

    const job = dataJobSchema.parse({
      id: generateDataJobId(),
      tenantId: auth.tenantId,
      type: 'export',
      entity: payload.entity,
      format: payload.format,
      status: 'completed',
      fileName: payload.fileName,
      companyId: payload.companyId,
      establishmentId: payload.establishmentId,
      filters: payload.filters,
      totalRows: rows.length,
      validRows: rows.length,
      invalidRows: 0,
      errors: [],
      previewRows: rows.slice(0, 20).map((row, index) => ({
        rowNumber: index + 1,
        values: Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, `${value ?? ''}`]),
        ),
        valid: true,
      })),
      outputPreview,
      createdBy: auth.uid,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    }) as DataJob;

    const savedJob = await this.repository.createDataJob(job);
    await this.writeAuditEvent({
      auth,
      context,
      action: 'data_job.exported',
      entityType: 'data_job',
      entityId: savedJob.id,
      after: {
        entity: savedJob.entity,
        totalRows: savedJob.totalRows,
      },
      metadata: {
        format: savedJob.format,
        fileName: savedJob.fileName,
      },
    });

    return savedJob;
  }
}
