import { MasterDataService } from "./service";
import { MasterDataContext } from "./domain";

export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  listCustomers(ctx: MasterDataContext, query: Record<string, string>) {
    return this.service.list(ctx, { kind: "customer", q: query.q, status: query.status, page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 25) });
  }

  createCustomer(ctx: MasterDataContext, body: unknown) {
    return this.service.create(ctx, { ...(body as object), kind: "customer" } as any);
  }

  listSuppliers(ctx: MasterDataContext, query: Record<string, string>) {
    return this.service.list(ctx, { kind: "supplier", q: query.q, status: query.status, page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 25) });
  }

  createSupplier(ctx: MasterDataContext, body: unknown) {
    return this.service.create(ctx, { ...(body as object), kind: "supplier" } as any);
  }

  listProducts(ctx: MasterDataContext, query: Record<string, string>) {
    return this.service.list(ctx, { kind: "product", q: query.q, status: query.status, page: Number(query.page ?? 1), pageSize: Number(query.pageSize ?? 25) });
  }

  createProduct(ctx: MasterDataContext, body: unknown) {
    return this.service.create(ctx, { ...(body as object), kind: "product" } as any);
  }

  update(ctx: MasterDataContext, id: string, version: number, body: unknown) {
    return this.service.update(ctx, id, version, body as any);
  }

  block(ctx: MasterDataContext, id: string, motivo: string) {
    return this.service.block(ctx, id, motivo);
  }

  delete(ctx: MasterDataContext, id: string) {
    return this.service.softDelete(ctx, id);
  }
}
