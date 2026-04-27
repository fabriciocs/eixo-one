import { SupplierStatus } from "../dto/create-supplier.dto";

export interface Supplier {
  id: string;
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  email?: string;
  phone?: string;
  status: SupplierStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface AuditLog {
  id: string;
  entity: "supplier";
  entityId: string;
  userId: string;
  action: "create" | "update" | "status_change" | "delete";
  metadata: Record<string, unknown>;
  createdAt: Date;
}
