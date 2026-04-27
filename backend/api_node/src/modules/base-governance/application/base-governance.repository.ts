import type {
  AuditEvent,
  BaseGovernanceRole,
  BaseGovernanceRoleStatus,
  BaseGovernanceSetting,
  CreateNotificationTemplateRequest,
  DataJob,
  DataJobEntity,
  DataJobStatus,
  DataJobType,
  ListNotificationDeliveriesQuery,
  ListNotificationTemplatesQuery,
  NotificationDelivery,
  NotificationTemplate,
  ListSettingsQuery,
  ResetSettingRequest,
  RetryNotificationRequest,
  SendNotificationRequest,
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

export type ListDataJobsFilters = {
  search?: string;
  entity?: DataJobEntity;
  type?: DataJobType;
  status?: DataJobStatus;
  page: number;
  pageSize: number;
};

export type ListNotificationTemplatesFilters = {
  search?: string;
  channel?: ListNotificationTemplatesQuery['channel'];
  eventKey?: string;
  status?: ListNotificationTemplatesQuery['status'];
  page: number;
  pageSize: number;
};

export type ListNotificationDeliveriesFilters = {
  search?: string;
  channel?: ListNotificationDeliveriesQuery['channel'];
  status?: ListNotificationDeliveriesQuery['status'];
  templateKey?: string;
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
  listNotificationTemplates(
    tenantId: string,
    filters: ListNotificationTemplatesFilters,
  ): Promise<BaseGovernanceListResult<NotificationTemplate>>;
  findNotificationTemplateById(
    tenantId: string,
    templateId: string,
  ): Promise<NotificationTemplate | null>;
  findNotificationTemplateByKey(
    tenantId: string,
    templateKey: string,
  ): Promise<NotificationTemplate | null>;
  createNotificationTemplate(
    template: NotificationTemplate,
  ): Promise<NotificationTemplate>;
  listNotificationDeliveries(
    tenantId: string,
    filters: ListNotificationDeliveriesFilters,
  ): Promise<BaseGovernanceListResult<NotificationDelivery>>;
  findNotificationDeliveryById(
    tenantId: string,
    deliveryId: string,
  ): Promise<NotificationDelivery | null>;
  createNotificationDelivery(
    delivery: NotificationDelivery,
  ): Promise<NotificationDelivery>;
  saveNotificationDelivery(
    delivery: NotificationDelivery,
  ): Promise<NotificationDelivery>;
  listAudit(
    tenantId: string,
    filters: ListAuditFilters,
  ): Promise<BaseGovernanceListResult<AuditEvent>>;
  listDataJobs(
    tenantId: string,
    filters: ListDataJobsFilters,
  ): Promise<BaseGovernanceListResult<DataJob>>;
  findDataJobById(tenantId: string, jobId: string): Promise<DataJob | null>;
  createDataJob(job: DataJob): Promise<DataJob>;
  saveDataJob(job: DataJob): Promise<DataJob>;
  isReady(): Promise<boolean>;
}
