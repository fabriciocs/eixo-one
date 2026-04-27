export const BASE_GOVERNANCE_PERMISSIONS = {
  rolesRead: "governance.roles.read",
  rolesManage: "governance.roles.manage",
  auditRead: "audit.read",
  settingsManage: "settings.manage",
  dataJobsManage: "data_exchange.manage",
  notificationsManage: "notifications.manage",
  integrationsManage: "integrations.manage",
  privacyManage: "privacy.manage",
  customersRead: "customers.read",
  customersCreate: "customers.create",
  customersUpdate: "customers.update",
  customersDelete: "customers.delete",
  customersExport: "customers.export",
} as const;

export type BaseGovernancePermission =
  (typeof BASE_GOVERNANCE_PERMISSIONS)[keyof typeof BASE_GOVERNANCE_PERMISSIONS];

export interface AuthorizationSubject {
  userId: string;
  tenantId: string;
  roleKeys: string[];
  permissionKeys: string[];
  mfaVerified?: boolean;
}

export interface ObjectScope {
  tenantId: string;
  companyId?: string;
  establishmentId?: string;
  costCenterId?: string;
  ownerUserId?: string;
  status?: string;
}

export function assertSameTenant(subject: AuthorizationSubject, scope: ObjectScope): void {
  if (subject.tenantId !== scope.tenantId) {
    throw new Error("FORBIDDEN_TENANT_SCOPE");
  }
}

export function hasPermission(subject: AuthorizationSubject, permission: string): boolean {
  return subject.roleKeys.includes("platform_admin") || subject.permissionKeys.includes(permission);
}
