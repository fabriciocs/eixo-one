import {
  AuditRecord,
  BaseGovernanceRepository,
  CustomerRecord,
  RoleRecord,
} from "../application/base-governance.repository";

export class InMemoryBaseGovernanceRepository implements BaseGovernanceRepository {
  private roles = new Map<string, RoleRecord>();
  private customers = new Map<string, CustomerRecord>();
  private audit: AuditRecord[] = [];

  async listRoles(tenantId: string): Promise<RoleRecord[]> {
    return [...this.roles.values()].filter((role) => role.tenantId === tenantId && role.status !== "archived");
  }

  async getRole(tenantId: string, roleId: string): Promise<RoleRecord | null> {
    const role = this.roles.get(roleId);
    return role && role.tenantId === tenantId ? role : null;
  }

  async saveRole(role: RoleRecord): Promise<RoleRecord> {
    this.roles.set(role.id, role);
    return role;
  }

  async listCustomers(tenantId: string, companyId?: string): Promise<CustomerRecord[]> {
    return [...this.customers.values()].filter((customer) => {
      return customer.tenantId === tenantId && customer.status !== "archived" && (!companyId || customer.companyId === companyId);
    });
  }

  async getCustomer(tenantId: string, customerId: string): Promise<CustomerRecord | null> {
    const customer = this.customers.get(customerId);
    return customer && customer.tenantId === tenantId ? customer : null;
  }

  async saveCustomer(customer: CustomerRecord): Promise<CustomerRecord> {
    this.customers.set(customer.id, customer);
    return customer;
  }

  async appendAudit(record: AuditRecord): Promise<void> {
    this.audit.push(record);
  }

  async listAudit(tenantId: string, resourceType?: string, resourceId?: string): Promise<AuditRecord[]> {
    return this.audit.filter((entry) => {
      return entry.tenantId === tenantId
        && (!resourceType || entry.resourceType === resourceType)
        && (!resourceId || entry.resourceId === resourceId);
    });
  }
}
