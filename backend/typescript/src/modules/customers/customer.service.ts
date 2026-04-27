import { AuditWriter, diffObjects, redactCustomerForAudit } from "./customer.audit";
import { Authorizer } from "./customer.authz";
import { customerEvent, DomainEventPublisher } from "./customer.events";
import { CustomerRepository, UnitOfWork } from "./customer.repository";
import {
  ConflictError,
  CustomerContext,
  CustomerFilters,
  CustomerMutableInput,
  CustomerRecord,
  NotFoundError,
  Page,
} from "./customer.types";
import { assertStatusTransition, validateCustomerInput } from "./customer.validators";

export interface CustomerServiceDeps {
  repository: CustomerRepository;
  unitOfWork: UnitOfWork;
  audit: AuditWriter;
  events: DomainEventPublisher;
  authorizer: Authorizer;
  now?: () => Date;
  idFactory?: () => string;
}

export class CustomerService {
  private readonly now: () => Date;
  private readonly idFactory: () => string;

  constructor(private readonly deps: CustomerServiceDeps) {
    this.now = deps.now ?? (() => new Date());
    this.idFactory = deps.idFactory ?? randomId;
  }

  async list(context: CustomerContext, filters: CustomerFilters): Promise<Page<CustomerRecord>> {
    this.deps.authorizer.assert("customers.read", context, { tenantId: context.tenantId, empresaId: filters.empresaId, filialId: filters.filialId });
    return this.deps.repository.list(context.tenantId, { ...filters, pageSize: Math.min(filters.pageSize ?? 25, 100) });
  }

  async get(context: CustomerContext, customerId: string): Promise<CustomerRecord> {
    const customer = await this.requireCustomer(context, customerId);
    this.deps.authorizer.assert("customers.read", context, customer);
    return customer;
  }

  async create(context: CustomerContext, input: CustomerMutableInput): Promise<CustomerRecord> {
    this.deps.authorizer.assert("customers.create", context, { tenantId: context.tenantId, empresaId: input.empresaId, filialId: input.filialId });

    const validated = validateCustomerInput(input);
    const createdAt = this.now().toISOString();

    return this.deps.unitOfWork.transaction(async () => {
      if (validated.cpfCnpjNormalizado) {
        const duplicate = await this.deps.repository.findActiveByDocument(context.tenantId, validated.empresaId, validated.cpfCnpjNormalizado);
        if (duplicate) throw new ConflictError("Já existe cliente ativo com este CPF/CNPJ nesta empresa.");
      }

      const customer = await this.deps.repository.create({
        ...validated,
        id: this.idFactory(),
        tenantId: context.tenantId,
        status: validated.status ?? "rascunho",
        createdAt,
        createdBy: context.actorId,
        updatedAt: createdAt,
        updatedBy: context.actorId,
        version: 1,
      });

      await this.deps.audit.write({
        tenantId: context.tenantId,
        empresaId: customer.empresaId,
        filialId: customer.filialId,
        actorId: context.actorId,
        entityType: "Customer",
        entityId: customer.id,
        action: "customer.created",
        after: redactCustomerForAudit(customer),
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });

      await this.deps.events.publish(customerEvent("customer.created", customer, context.actorId, context.correlationId));

      return customer;
    });
  }

  async update(context: CustomerContext, customerId: string, expectedVersion: number, input: CustomerMutableInput): Promise<CustomerRecord> {
    const before = await this.requireCustomer(context, customerId);
    this.deps.authorizer.assert("customers.update", context, before);

    if (input.limiteCreditoCentavos !== before.limiteCreditoCentavos) {
      this.deps.authorizer.assert("customers.credit.update", context, before);
    }

    const validated = validateCustomerInput(input);
    const updatedAt = this.now().toISOString();

    return this.deps.unitOfWork.transaction(async () => {
      if (validated.cpfCnpjNormalizado) {
        const duplicate = await this.deps.repository.findActiveByDocument(
          context.tenantId,
          validated.empresaId,
          validated.cpfCnpjNormalizado,
          customerId,
        );
        if (duplicate) throw new ConflictError("Já existe cliente ativo com este CPF/CNPJ nesta empresa.");
      }

      const after = await this.deps.repository.update(context.tenantId, customerId, expectedVersion, {
        ...validated,
        updatedAt,
        updatedBy: context.actorId,
      });

      const diff = diffObjects(redactCustomerForAudit(before) as Record<string, unknown>, redactCustomerForAudit(after) as Record<string, unknown>);

      await this.deps.audit.write({
        tenantId: context.tenantId,
        empresaId: after.empresaId,
        filialId: after.filialId,
        actorId: context.actorId,
        entityType: "Customer",
        entityId: after.id,
        action: "customer.updated",
        before: redactCustomerForAudit(before),
        after: redactCustomerForAudit(after),
        diff,
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });

      const type = input.limiteCreditoCentavos !== before.limiteCreditoCentavos ? "customer.credit_limit_changed" : "customer.updated";
      await this.deps.events.publish(customerEvent(type, after, context.actorId, context.correlationId));

      return after;
    });
  }

  async changeStatus(
    context: CustomerContext,
    customerId: string,
    expectedVersion: number,
    nextStatus: CustomerRecord["status"],
    reason: string,
  ): Promise<CustomerRecord> {
    const before = await this.requireCustomer(context, customerId);
    this.deps.authorizer.assert(nextStatus === "bloqueado" ? "customers.block" : "customers.update", context, before);

    assertStatusTransition(before.status, nextStatus, context.permissions.includes("customers.block"));

    return this.deps.unitOfWork.transaction(async () => {
      const after = await this.deps.repository.update(context.tenantId, customerId, expectedVersion, {
        status: nextStatus,
        updatedAt: this.now().toISOString(),
        updatedBy: context.actorId,
      });

      await this.deps.audit.write({
        tenantId: context.tenantId,
        empresaId: after.empresaId,
        filialId: after.filialId,
        actorId: context.actorId,
        entityType: "Customer",
        entityId: after.id,
        action: "customer.status_changed",
        before: { status: before.status },
        after: { status: after.status, reason },
        diff: { status: { before: before.status, after: after.status }, reason },
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });

      await this.deps.events.publish(customerEvent("customer.status_changed", after, context.actorId, context.correlationId, { status: nextStatus }));

      return after;
    });
  }

  async softDelete(context: CustomerContext, customerId: string, expectedVersion: number): Promise<void> {
    const before = await this.requireCustomer(context, customerId);
    this.deps.authorizer.assert("customers.delete", context, before);

    await this.deps.unitOfWork.transaction(async () => {
      const deletedAt = this.now().toISOString();
      await this.deps.repository.softDelete(context.tenantId, customerId, expectedVersion, context.actorId, deletedAt);

      await this.deps.audit.write({
        tenantId: context.tenantId,
        empresaId: before.empresaId,
        filialId: before.filialId,
        actorId: context.actorId,
        entityType: "Customer",
        entityId: before.id,
        action: "customer.deleted",
        before: redactCustomerForAudit(before),
        after: { deletedAt, deletedBy: context.actorId },
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      });

      await this.deps.events.publish(customerEvent("customer.deleted", before, context.actorId, context.correlationId));
    });
  }

  private async requireCustomer(context: CustomerContext, customerId: string): Promise<CustomerRecord> {
    const customer = await this.deps.repository.findById(context.tenantId, customerId);
    if (!customer || customer.deletedAt) throw new NotFoundError();
    return customer;
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
