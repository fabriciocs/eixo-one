import { CustomerFilters, CustomerRecord, Page } from "./customer.types";

export interface CreateCustomerRecordInput extends Omit<CustomerRecord, "id" | "version"> {
  id?: string;
  version?: number;
}

export interface CustomerRepository {
  list(tenantId: string, filters: CustomerFilters): Promise<Page<CustomerRecord>>;
  findById(tenantId: string, customerId: string): Promise<CustomerRecord | undefined>;
  findActiveByDocument(
    tenantId: string,
    empresaId: string,
    cpfCnpjNormalizado: string,
    excludeCustomerId?: string,
  ): Promise<CustomerRecord | undefined>;
  create(input: CreateCustomerRecordInput): Promise<CustomerRecord>;
  update(
    tenantId: string,
    customerId: string,
    expectedVersion: number,
    patch: Partial<CustomerRecord>,
  ): Promise<CustomerRecord>;
  softDelete(
    tenantId: string,
    customerId: string,
    expectedVersion: number,
    deletedBy: string,
    deletedAt: string,
  ): Promise<void>;
}

export interface UnitOfWork {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
