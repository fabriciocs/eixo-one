export interface RoleRecord {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  permissionKeys: string[];
  companyIds: string[];
  establishmentIds: string[];
  status: "draft" | "active" | "inactive" | "archived";
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CustomerRecord {
  id: string;
  tenantId: string;
  companyId: string;
  type: "person" | "company";
  document: string;
  legalName: string;
  status: "draft" | "active" | "blocked" | "inactive" | "archived";
  creditLimit: number;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditRecord {
  id: string;
  tenantId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  diff: Record<string, unknown>;
  correlationId: string;
  createdAt: string;
}

export interface BaseGovernanceRepository {
  listRoles(tenantId: string): Promise<RoleRecord[]>;
  getRole(tenantId: string, roleId: string): Promise<RoleRecord | null>;
  saveRole(role: RoleRecord): Promise<RoleRecord>;

  listCustomers(tenantId: string, companyId?: string): Promise<CustomerRecord[]>;
  getCustomer(tenantId: string, customerId: string): Promise<CustomerRecord | null>;
  saveCustomer(customer: CustomerRecord): Promise<CustomerRecord>;

  appendAudit(record: AuditRecord): Promise<void>;
  listAudit(tenantId: string, resourceType?: string, resourceId?: string): Promise<AuditRecord[]>;
}
