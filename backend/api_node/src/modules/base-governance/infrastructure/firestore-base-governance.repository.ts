import {
  FieldPath,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';
import {
  auditEventSchema,
  baseGovernanceRoleSchema,
  baseGovernanceSettingSchema,
  dataJobSchema,
  notificationDeliverySchema,
  notificationTemplateSchema,
  type AuditEvent,
  type BaseGovernanceRole,
  type BaseGovernanceSetting,
  type DataJob,
  type NotificationDelivery,
  type NotificationTemplate,
  type SettingScopeType,
} from '@eixoone/shared-contracts';

import { AppError } from '../../../core/errors/app-error.js';
import { sanitizeFirestoreData } from '../../../integrations/firebase/firestore-sanitize.js';
import type {
  BaseGovernanceListResult,
  BaseGovernanceRepository,
  ListAuditFilters,
  ListNotificationDeliveriesFilters,
  ListNotificationTemplatesFilters,
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

export class FirestoreBaseGovernanceRepository
  implements BaseGovernanceRepository
{
  constructor(private readonly firestore: Firestore) {}

  private isAlreadyExistsError(error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
    return code === '6' || code === 'already-exists';
  }

  private isFailedPreconditionError(error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
    return code === '9' || code === 'failed-precondition';
  }

  private rolesCollection() {
    return this.firestore.collection('roles');
  }

  private auditLogsCollection() {
    return this.firestore.collection('audit_logs');
  }

  private settingsCollection() {
    return this.firestore.collection('settings');
  }

  private dataJobsCollection() {
    return this.firestore.collection('data_jobs');
  }

  private notificationTemplatesCollection() {
    return this.firestore.collection('notification_templates');
  }

  private notificationDeliveriesCollection() {
    return this.firestore.collection('notification_deliveries');
  }

  private settingDocumentId(input: {
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
    ].join('__');
  }

  async listRoles(
    tenantId: string,
    filters: ListRolesFilters,
  ): Promise<BaseGovernanceListResult<BaseGovernanceRole>> {
    const snapshot = await this.rolesCollection()
      .where('tenantId', '==', tenantId)
      .get();
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const roles = snapshot.docs
      .map((documentSnapshot) =>
        baseGovernanceRoleSchema.parse(documentSnapshot.data()) as BaseGovernanceRole,
      )
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

    return paginate(roles, filters.page, filters.pageSize);
  }

  async findRoleById(tenantId: string, roleId: string) {
    const snapshot = await this.rolesCollection().doc(roleId).get();

    if (!snapshot.exists) {
      return null;
    }

    const role = baseGovernanceRoleSchema.parse(snapshot.data()) as BaseGovernanceRole;
    return role.tenantId === tenantId ? role : null;
  }

  async findRoleByKey(tenantId: string, key: string) {
    const snapshot = await this.rolesCollection()
      .where('tenantId', '==', tenantId)
      .where('key', '==', key)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return baseGovernanceRoleSchema.parse(snapshot.docs[0]?.data()) as BaseGovernanceRole;
  }

  async listRolesByKeys(tenantId: string, roleKeys: string[]) {
    if (roleKeys.length === 0) {
      return [];
    }

    const snapshot = await this.rolesCollection()
      .where('tenantId', '==', tenantId)
      .get();
    const keys = new Set(roleKeys);

    return snapshot.docs
      .map((documentSnapshot) =>
        baseGovernanceRoleSchema.parse(documentSnapshot.data()) as BaseGovernanceRole,
      )
      .filter((role) => keys.has(role.key));
  }

  async createRole(role: BaseGovernanceRole) {
    const parsedRole = baseGovernanceRoleSchema.parse(role) as BaseGovernanceRole;

    try {
      await this.rolesCollection()
        .doc(parsedRole.roleId)
        .create(sanitizeFirestoreData(parsedRole) as unknown as DocumentData);
    } catch (error) {
      if (this.isAlreadyExistsError(error)) {
        throw new AppError(409, 'DUPLICATE_RECORD', 'Perfil ja cadastrado.');
      }

      throw error;
    }

    return parsedRole;
  }

  async updateRole(input: {
    tenantId: string;
    roleId: string;
    expectedVersion: number;
    role: BaseGovernanceRole;
  }) {
    const documentReference = this.rolesCollection().doc(input.roleId);
    const snapshot = await documentReference.get();

    if (!snapshot.exists) {
      throw new AppError(404, 'NOT_FOUND', 'Perfil nao encontrado.');
    }

    const currentRole =
      baseGovernanceRoleSchema.parse(snapshot.data()) as BaseGovernanceRole;
    if (currentRole.tenantId !== input.tenantId) {
      throw new AppError(404, 'NOT_FOUND', 'Perfil nao encontrado.');
    }

    if (currentRole.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao do perfil desatualizada. Recarregue os dados.',
      );
    }

    const parsedRole =
      baseGovernanceRoleSchema.parse(input.role) as BaseGovernanceRole;

    try {
      await documentReference.update(
        sanitizeFirestoreData(parsedRole) as unknown as DocumentData,
        { lastUpdateTime: snapshot.updateTime },
      );
    } catch (error) {
      if (this.isFailedPreconditionError(error)) {
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          'Versao do perfil desatualizada. Recarregue os dados.',
        );
      }

      throw error;
    }

    return parsedRole;
  }

  async listSettings(
    tenantId: string,
    filters: ListSettingsFilters,
  ): Promise<BaseGovernanceListResult<BaseGovernanceSetting>> {
    const snapshot = await this.settingsCollection()
      .where('tenantId', '==', tenantId)
      .get();
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const settings = snapshot.docs
      .map((documentSnapshot) =>
        baseGovernanceSettingSchema.parse(
          documentSnapshot.data(),
        ) as BaseGovernanceSetting,
      )
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
    const snapshot = await this.settingsCollection()
      .doc(this.settingDocumentId(input))
      .get();

    if (!snapshot.exists) {
      return null;
    }

    return baseGovernanceSettingSchema.parse(
      snapshot.data(),
    ) as BaseGovernanceSetting;
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
    const documentReference = this.settingsCollection().doc(
      this.settingDocumentId(input),
    );
    const snapshot = await documentReference.get();
    const currentSetting = snapshot.exists
      ? (baseGovernanceSettingSchema.parse(
          snapshot.data(),
        ) as BaseGovernanceSetting)
      : null;

    if (currentSetting && currentSetting.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao da configuracao desatualizada. Recarregue os dados.',
      );
    }

    const parsedSetting =
      baseGovernanceSettingSchema.parse(input.setting) as BaseGovernanceSetting;

    if (!snapshot.exists) {
      await documentReference.create(
        sanitizeFirestoreData(parsedSetting) as unknown as DocumentData,
      );
      return parsedSetting;
    }

    try {
      await documentReference.update(
        sanitizeFirestoreData(parsedSetting) as unknown as DocumentData,
        { lastUpdateTime: snapshot.updateTime },
      );
    } catch (error) {
      if (this.isFailedPreconditionError(error)) {
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          'Versao da configuracao desatualizada. Recarregue os dados.',
        );
      }

      throw error;
    }

    return parsedSetting;
  }

  async listNotificationTemplates(
    tenantId: string,
    filters: ListNotificationTemplatesFilters,
  ) {
    const snapshot = await this.notificationTemplatesCollection()
      .where('tenantId', '==', tenantId)
      .get();
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const templates = snapshot.docs
      .map((documentSnapshot) =>
        notificationTemplateSchema.parse(
          documentSnapshot.data(),
        ) as NotificationTemplate,
      )
      .filter((template) => !filters.channel || template.channel === filters.channel)
      .filter((template) => !filters.eventKey || template.eventKey === filters.eventKey)
      .filter((template) => !filters.status || template.status === filters.status)
      .filter((template) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          template.key,
          template.label,
          template.description ?? '',
          template.eventKey,
          template.channel,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => left.label.localeCompare(right.label));

    return paginate(templates, filters.page, filters.pageSize);
  }

  async findNotificationTemplateById(tenantId: string, templateId: string) {
    const snapshot = await this.notificationTemplatesCollection().doc(templateId).get();
    if (!snapshot.exists) {
      return null;
    }

    const template = notificationTemplateSchema.parse(
      snapshot.data(),
    ) as NotificationTemplate;
    return template.tenantId === tenantId ? template : null;
  }

  async findNotificationTemplateByKey(tenantId: string, templateKey: string) {
    const snapshot = await this.notificationTemplatesCollection()
      .where('tenantId', '==', tenantId)
      .where('key', '==', templateKey)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return notificationTemplateSchema.parse(
      snapshot.docs[0]?.data(),
    ) as NotificationTemplate;
  }

  async createNotificationTemplate(template: NotificationTemplate) {
    const parsedTemplate =
      notificationTemplateSchema.parse(template) as NotificationTemplate;
    await this.notificationTemplatesCollection()
      .doc(parsedTemplate.templateId)
      .set(sanitizeFirestoreData(parsedTemplate) as unknown as DocumentData);
    return parsedTemplate;
  }

  async listNotificationDeliveries(
    tenantId: string,
    filters: ListNotificationDeliveriesFilters,
  ) {
    const snapshot = await this.notificationDeliveriesCollection()
      .where('tenantId', '==', tenantId)
      .get();
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const deliveries = snapshot.docs
      .map((documentSnapshot) =>
        notificationDeliverySchema.parse(
          documentSnapshot.data(),
        ) as NotificationDelivery,
      )
      .filter((delivery) => !filters.channel || delivery.channel === filters.channel)
      .filter((delivery) => !filters.status || delivery.status === filters.status)
      .filter(
        (delivery) => !filters.templateKey || delivery.templateKey === filters.templateKey,
      )
      .filter((delivery) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          delivery.templateKey,
          delivery.recipient,
          delivery.channel,
          delivery.status,
          delivery.eventKey,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => right.queuedAt.localeCompare(left.queuedAt));

    return paginate(deliveries, filters.page, filters.pageSize);
  }

  async findNotificationDeliveryById(tenantId: string, deliveryId: string) {
    const snapshot = await this.notificationDeliveriesCollection().doc(deliveryId).get();
    if (!snapshot.exists) {
      return null;
    }

    const delivery = notificationDeliverySchema.parse(
      snapshot.data(),
    ) as NotificationDelivery;
    return delivery.tenantId === tenantId ? delivery : null;
  }

  async createNotificationDelivery(delivery: NotificationDelivery) {
    const parsedDelivery =
      notificationDeliverySchema.parse(delivery) as NotificationDelivery;
    await this.notificationDeliveriesCollection()
      .doc(parsedDelivery.deliveryId)
      .set(sanitizeFirestoreData(parsedDelivery) as unknown as DocumentData);
    return parsedDelivery;
  }

  async saveNotificationDelivery(delivery: NotificationDelivery) {
    const parsedDelivery =
      notificationDeliverySchema.parse(delivery) as NotificationDelivery;
    await this.notificationDeliveriesCollection()
      .doc(parsedDelivery.deliveryId)
      .set(sanitizeFirestoreData(parsedDelivery) as unknown as DocumentData);
    return parsedDelivery;
  }

  async listAudit(
    tenantId: string,
    filters: ListAuditFilters,
  ): Promise<BaseGovernanceListResult<AuditEvent>> {
    const snapshot = await this.auditLogsCollection()
      .where('tenantId', '==', tenantId)
      .get();

    const events = snapshot.docs
      .map((documentSnapshot) =>
        auditEventSchema.parse(documentSnapshot.data()) as AuditEvent,
      )
      .filter((event) => !filters.entityType || event.entityType === filters.entityType)
      .filter((event) => !filters.entityId || event.entityId === filters.entityId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return paginate(events, filters.page, filters.pageSize);
  }

  async listDataJobs(
    tenantId: string,
    filters: ListDataJobsFilters,
  ): Promise<BaseGovernanceListResult<DataJob>> {
    const snapshot = await this.dataJobsCollection()
      .where('tenantId', '==', tenantId)
      .get();
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const jobs = snapshot.docs
      .map((documentSnapshot) =>
        dataJobSchema.parse(documentSnapshot.data()) as DataJob,
      )
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
    const snapshot = await this.dataJobsCollection().doc(jobId).get();
    if (!snapshot.exists) {
      return null;
    }

    const job = dataJobSchema.parse(snapshot.data()) as DataJob;
    return job.tenantId === tenantId ? job : null;
  }

  async createDataJob(job: DataJob) {
    const parsedJob = dataJobSchema.parse(job) as DataJob;
    await this.dataJobsCollection()
      .doc(parsedJob.id)
      .set(sanitizeFirestoreData(parsedJob) as unknown as DocumentData);
    return parsedJob;
  }

  async saveDataJob(job: DataJob) {
    const parsedJob = dataJobSchema.parse(job) as DataJob;
    await this.dataJobsCollection()
      .doc(parsedJob.id)
      .set(sanitizeFirestoreData(parsedJob) as unknown as DocumentData);
    return parsedJob;
  }

  async isReady() {
    try {
      await Promise.all([
        this.rolesCollection().limit(1).select(FieldPath.documentId()).get(),
        this.settingsCollection().limit(1).select(FieldPath.documentId()).get(),
        this.dataJobsCollection().limit(1).select(FieldPath.documentId()).get(),
        this.notificationTemplatesCollection()
          .limit(1)
          .select(FieldPath.documentId())
          .get(),
        this.notificationDeliveriesCollection()
          .limit(1)
          .select(FieldPath.documentId())
          .get(),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}
