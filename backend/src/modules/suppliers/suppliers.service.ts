import { randomUUID } from "crypto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { Supplier, AuditLog } from "./entities/supplier.entity";
import { isValidCnpj, normalizeCnpj } from "../../common/security/cnpj";

export class SuppliersService {
  private suppliers = new Map<string, Supplier>();
  private auditLogs: AuditLog[] = [];

  create(dto: CreateSupplierDto, userId: string): Supplier {
    const cnpj = normalizeCnpj(dto.cnpj);

    if (!isValidCnpj(cnpj)) {
      throw new Error("CNPJ inválido.");
    }

    const alreadyExists = Array.from(this.suppliers.values()).some(
      supplier => supplier.cnpj === cnpj && !supplier.deletedAt
    );

    if (alreadyExists) {
      throw new Error("Já existe fornecedor cadastrado com este CNPJ.");
    }

    const now = new Date();
    const supplier: Supplier = {
      id: randomUUID(),
      corporateName: dto.corporateName.trim(),
      tradeName: dto.tradeName?.trim(),
      cnpj,
      email: dto.email?.trim().toLowerCase(),
      phone: dto.phone?.replace(/\D/g, ""),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    this.suppliers.set(supplier.id, supplier);
    this.auditLogs.push({
      id: randomUUID(),
      entity: "supplier",
      entityId: supplier.id,
      userId,
      action: "create",
      metadata: { fields: ["corporateName", "cnpj", "email", "phone"] },
      createdAt: now
    });

    return supplier;
  }

  list(): Supplier[] {
    return Array.from(this.suppliers.values()).filter(supplier => !supplier.deletedAt);
  }

  getAuditLogs(supplierId: string): AuditLog[] {
    return this.auditLogs.filter(log => log.entityId === supplierId);
  }
}
