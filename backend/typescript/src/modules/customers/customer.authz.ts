import { CustomerAction, CustomerContext, CustomerRecord, ForbiddenError } from "./customer.types";

export interface Authorizer {
  assert(action: CustomerAction, context: CustomerContext, resource?: Pick<CustomerRecord, "empresaId" | "filialId" | "tenantId">): void;
}

export class DefaultCustomerAuthorizer implements Authorizer {
  assert(action: CustomerAction, context: CustomerContext, resource?: Pick<CustomerRecord, "empresaId" | "filialId" | "tenantId">): void {
    if (!context.permissions.includes(action)) {
      throw new ForbiddenError();
    }

    if (resource?.tenantId && resource.tenantId !== context.tenantId) {
      throw new ForbiddenError();
    }

    if (resource?.empresaId && !context.empresaIds.includes(resource.empresaId)) {
      throw new ForbiddenError();
    }

    if (resource?.filialId && context.filialIds?.length && !context.filialIds.includes(resource.filialId)) {
      throw new ForbiddenError();
    }
  }
}
