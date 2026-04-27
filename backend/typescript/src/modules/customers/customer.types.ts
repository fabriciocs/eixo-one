export type PersonType = "PF" | "PJ" | "ESTRANGEIRO";
export type CustomerStatus = "rascunho" | "ativo" | "bloqueado" | "inativo";

export type CustomerAction =
  | "customers.read"
  | "customers.create"
  | "customers.update"
  | "customers.delete"
  | "customers.block"
  | "customers.credit.update"
  | "customers.export"
  | "customers.audit.read";

export interface CustomerContext {
  tenantId: string;
  actorId: string;
  empresaIds: string[];
  filialIds?: string[];
  permissions: string[];
  ip?: string;
  userAgent?: string;
  correlationId: string;
}

export interface CustomerAddress {
  id?: string;
  label: string;
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city: string;
  state?: string;
  country: string;
  isPrimary: boolean;
}

export interface CustomerContact {
  id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface CustomerMutableInput {
  empresaId: string;
  filialId?: string;
  codigo?: string;
  tipoPessoa: PersonType;
  nome: string;
  nomeFantasia?: string;
  cpfCnpj?: string;
  documentoEstrangeiro?: string;
  email?: string;
  telefone?: string;
  limiteCreditoCentavos?: number;
  vendedorResponsavelId?: string;
  status?: CustomerStatus;
  tags?: string[];
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  observacao?: string;
}

export interface CustomerRecord extends CustomerMutableInput {
  id: string;
  tenantId: string;
  nomeNormalizado: string;
  cpfCnpjNormalizado?: string;
  emailNormalizado?: string;
  telefoneNormalizado?: string;
  status: CustomerStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface CustomerFilters {
  empresaId: string;
  filialId?: string;
  q?: string;
  status?: CustomerStatus;
  tipoPessoa?: PersonType;
  tag?: string;
  vendedorResponsavelId?: string;
  pageSize?: number;
  cursor?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

export interface AuditEventInput {
  tenantId: string;
  empresaId: string;
  filialId?: string;
  actorId: string;
  entityType: "Customer";
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  diff?: unknown;
  ip?: string;
  userAgent?: string;
  correlationId: string;
}

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 422,
    public readonly fieldErrors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Sem permissão para executar esta ação.") {
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Cliente não encontrado.") {
    super("NOT_FOUND", message, 404);
  }
}
