import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { SuppliersService } from "./suppliers.service";

export class SuppliersController {
  constructor(private readonly suppliersService = new SuppliersService()) {}

  create(dto: CreateSupplierDto, userId: string) {
    return this.suppliersService.create(dto, userId);
  }

  list() {
    return this.suppliersService.list();
  }

  auditLogs(supplierId: string) {
    return this.suppliersService.getAuditLogs(supplierId);
  }
}
