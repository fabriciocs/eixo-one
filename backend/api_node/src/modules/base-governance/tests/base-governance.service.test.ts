import { describe, expect, it } from "vitest";
import { BaseGovernanceService } from "../application/base-governance.service";
import { InMemoryBaseGovernanceRepository } from "../infrastructure/in-memory-base-governance.repository";

const admin = {
  userId: "user_admin",
  tenantId: "tenant_demo",
  roleKeys: ["admin"],
  permissionKeys: [
    "governance.roles.read",
    "governance.roles.manage",
    "audit.read",
    "customers.read",
    "customers.create",
    "customers.update",
  ],
};

describe("BaseGovernanceService", () => {
  it("creates roles with audit trail", async () => {
    const service = new BaseGovernanceService(new InMemoryBaseGovernanceRepository());
    const role = await service.createRole(admin, {
      key: "finance.viewer",
      name: "Financeiro leitura",
      permissionKeys: ["customers.read"],
      companyIds: ["company_1"],
      establishmentIds: [],
      status: "active",
    }, "corr-test");

    const audit = await service.listAudit(admin, "role", role.id);
    expect(role.version).toBe(0);
    expect(audit).toHaveLength(1);
  });

  it("rejects customer without permission", async () => {
    const service = new BaseGovernanceService(new InMemoryBaseGovernanceRepository());
    await expect(service.createCustomer({ ...admin, permissionKeys: [] }, {
      companyId: "company_1",
      type: "person",
      document: "12345678901",
      legalName: "Cliente teste",
      status: "active",
      creditLimit: 0,
    }, "corr-test")).rejects.toThrow("FORBIDDEN");
  });

  it("validates customer document and optimistic concurrency", async () => {
    const service = new BaseGovernanceService(new InMemoryBaseGovernanceRepository());
    const customer = await service.createCustomer(admin, {
      companyId: "company_1",
      type: "person",
      document: "123.456.789-01",
      legalName: "Cliente teste",
      status: "active",
      creditLimit: 100,
    }, "corr-test");

    await expect(service.updateCustomer(admin, customer.id, 99, { creditLimit: 200 }, "corr-test"))
      .rejects.toThrow("VERSION_CONFLICT");
  });
});
