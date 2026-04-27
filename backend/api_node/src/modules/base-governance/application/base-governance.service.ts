import crypto from 'node:crypto';

import {
  auditEventSchema,
  baseGovernanceRoleSchema,
  baseGovernanceSettingSchema,
  contractVersion,
  type AuditEvent,
  type BaseGovernanceRole,
  type BaseGovernanceSetting,
  type CreateRoleRequest,
  type ListAuditEventsQuery,
  type ListRolesQuery,
  type ListSettingsQuery,
  type PermissionCatalogEntry,
  type ResetSettingRequest,
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
}
