import type {
  AuditEvent,
  BaseGovernanceRole,
  BaseGovernanceRoleStatus,
  BaseGovernanceSetting,
  ListSettingsQuery,
  ResetSettingRequest,
  SettingScopeType,
  UpdateSettingRequest,
} from '@eixoone/shared-contracts';

export type BaseGovernanceListResult<T> = {
  items: T[];
  totalItems: number;
  hasNextPage: boolean;
  page: number;
  pageSize: number;
};

export type ListRolesFilters = {
  search?: string;
  status?: BaseGovernanceRoleStatus;
  page: number;
  pageSize: number;
};

export type ListAuditFilters = {
  entityType?: string;
  entityId?: string;
  page: number;
  pageSize: number;
};

export type ListSettingsFilters = {
  search?: string;
  moduleKey?: string;
  scopeType?: SettingScopeType;
  sensitive?: boolean;
  status?: ListSettingsQuery['status'];
  page: number;
  pageSize: number;
};

export interface BaseGovernanceRepository {
  listRoles(
    tenantId: string,
    filters: ListRolesFilters,
  ): Promise<BaseGovernanceListResult<BaseGovernanceRole>>;
  findRoleById(
    tenantId: string,
    roleId: string,
  ): Promise<BaseGovernanceRole | null>;
  findRoleByKey(
    tenantId: string,
    key: string,
  ): Promise<BaseGovernanceRole | null>;
  listRolesByKeys(
    tenantId: string,
    roleKeys: string[],
  ): Promise<BaseGovernanceRole[]>;
  createRole(role: BaseGovernanceRole): Promise<BaseGovernanceRole>;
  updateRole(input: {
    tenantId: string;
    roleId: string;
    expectedVersion: number;
    role: BaseGovernanceRole;
  }): Promise<BaseGovernanceRole>;
  listSettings(
    tenantId: string,
    filters: ListSettingsFilters,
  ): Promise<BaseGovernanceListResult<BaseGovernanceSetting>>;
  findSetting(input: {
    tenantId: string;
    settingKey: string;
    scopeType: SettingScopeType;
    companyId?: string;
    establishmentId?: string;
  }): Promise<BaseGovernanceSetting | null>;
  upsertSetting(input: {
    tenantId: string;
    settingKey: string;
    scopeType: SettingScopeType;
    companyId?: string;
    establishmentId?: string;
    expectedVersion: number;
    setting: BaseGovernanceSetting;
  }): Promise<BaseGovernanceSetting>;
  listAudit(
    tenantId: string,
    filters: ListAuditFilters,
  ): Promise<BaseGovernanceListResult<AuditEvent>>;
  isReady(): Promise<boolean>;
}
