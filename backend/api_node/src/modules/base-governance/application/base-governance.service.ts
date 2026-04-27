import {
  AuthorizationSubject,
  BASE_GOVERNANCE_PERMISSIONS,
  assertSameTenant,
  hasPermission,
} from "../domain/base-governance-permissions";
import {
  AuditRecord,
  BaseGovernanceRepository,
  CustomerRecord,
  RoleRecord,
} from "./base-governance.repository";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

function requirePermission(subject: AuthorizationSubject, permission: string): void {
  if (!hasPermission(subject, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export class BaseGovernanceService {
  constructor(private readonly repository: BaseGovernanceRepository) {}

  async createRole(
    subject: AuthorizationSubject,
    input: Omit<RoleRecord, "id" | "tenantId" | "version" | "createdAt" | "createdBy">,
    correlationId: string,
  ): Promise<RoleRecord> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.rolesManage);
    const role: RoleRecord = {
      ...input,
      id: id("role"),
      tenantId: subject.tenantId,
      version: 0,
      createdAt: now(),
      createdBy: subject.userId,
    };
    const saved = await this.repository.saveRole(role);
    await this.audit(subject, "role.created", "role", saved.id, { after: saved }, correlationId);
    return saved;
  }

  async updateRole(
    subject: AuthorizationSubject,
    roleId: string,
    expectedVersion: number,
    patch: Partial<Pick<RoleRecord, "name" | "permissionKeys" | "companyIds" | "establishmentIds" | "status">>,
    correlationId: string,
  ): Promise<RoleRecord> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.rolesManage);
    const current = await this.repository.getRole(subject.tenantId, roleId);
    if (!current) throw new Error("ROLE_NOT_FOUND");
    if (current.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
    const next: RoleRecord = {
      ...current,
      ...patch,
      version: current.version + 1,
      updatedAt: now(),
      updatedBy: subject.userId,
    };
    const saved = await this.repository.saveRole(next);
    await this.audit(subject, "role.updated", "role", saved.id, { before: current, after: saved }, correlationId);
    return saved;
  }

  async listRoles(subject: AuthorizationSubject): Promise<RoleRecord[]> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.rolesRead);
    return this.repository.listRoles(subject.tenantId);
  }

  async createCustomer(
    subject: AuthorizationSubject,
    input: Omit<CustomerRecord, "id" | "tenantId" | "version" | "createdAt" | "createdBy">,
    correlationId: string,
  ): Promise<CustomerRecord> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.customersCreate);
    assertSameTenant(subject, { tenantId: subject.tenantId, companyId: input.companyId });
    const customer: CustomerRecord = {
      ...input,
      id: id("cus"),
      tenantId: subject.tenantId,
      document: input.document.replace(/\D/g, ""),
      version: 0,
      createdAt: now(),
      createdBy: subject.userId,
    };
    this.validateCustomerDocument(customer);
    const saved = await this.repository.saveCustomer(customer);
    await this.audit(subject, "customer.created", "customer", saved.id, { after: this.maskCustomer(saved) }, correlationId);
    return saved;
  }

  async updateCustomer(
    subject: AuthorizationSubject,
    customerId: string,
    expectedVersion: number,
    patch: Partial<Pick<CustomerRecord, "legalName" | "status" | "creditLimit">>,
    correlationId: string,
  ): Promise<CustomerRecord> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.customersUpdate);
    const current = await this.repository.getCustomer(subject.tenantId, customerId);
    if (!current) throw new Error("CUSTOMER_NOT_FOUND");
    if (current.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
    const next: CustomerRecord = { ...current, ...patch, version: current.version + 1, updatedAt: now(), updatedBy: subject.userId };
    this.validateCustomerDocument(next);
    const saved = await this.repository.saveCustomer(next);
    await this.audit(subject, "customer.updated", "customer", saved.id, {
      before: this.maskCustomer(current),
      after: this.maskCustomer(saved),
    }, correlationId);
    return saved;
  }

  async listCustomers(subject: AuthorizationSubject, companyId?: string): Promise<CustomerRecord[]> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.customersRead);
    return this.repository.listCustomers(subject.tenantId, companyId);
  }

  async listAudit(subject: AuthorizationSubject, resourceType?: string, resourceId?: string): Promise<AuditRecord[]> {
    requirePermission(subject, BASE_GOVERNANCE_PERMISSIONS.auditRead);
    return this.repository.listAudit(subject.tenantId, resourceType, resourceId);
  }

  private validateCustomerDocument(customer: CustomerRecord): void {
    if (!/^\d{11}$|^\d{14}$/.test(customer.document)) {
      throw new Error("INVALID_CUSTOMER_DOCUMENT");
    }
    if (customer.creditLimit < 0) {
      throw new Error("INVALID_CREDIT_LIMIT");
    }
  }

  private maskCustomer(customer: CustomerRecord): CustomerRecord {
    return { ...customer, document: customer.document.replace(/^(\d{3})\d+(\d{2})$/, "$1******$2") };
  }

  private async audit(
    subject: AuthorizationSubject,
    action: string,
    resourceType: string,
    resourceId: string,
    diff: Record<string, unknown>,
    correlationId: string,
  ): Promise<void> {
    await this.repository.appendAudit({
      id: id("aud"),
      tenantId: subject.tenantId,
      actorUserId: subject.userId,
      action,
      resourceType,
      resourceId,
      diff,
      correlationId,
      createdAt: now(),
    });
  }
}
