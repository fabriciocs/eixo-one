export type UUID = string;

export type MasterDataKind = "customer" | "supplier" | "product";
export type EntityStatus = "draft" | "active" | "blocked" | "inactive" | "archived";
export type PersonType = "PF" | "PJ";

export interface MasterDataContext {
  tenantId: UUID;
  empresaId: UUID;
  filialId?: UUID;
  actorId: UUID;
  roles: string[];
  permissions: string[];
  correlationId: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditEvent {
  id: UUID;
  tenantId: UUID;
  empresaId: UUID;
  filialId?: UUID;
  actorId: UUID;
  entityType: string;
  entityId: UUID;
  action: string;
  before?: unknown;
  after?: unknown;
  diff?: unknown;
  correlationId: string;
  createdAt: string;
}

export interface BaseMasterRecord {
  id: UUID;
  tenantId: UUID;
  empresaId: UUID;
  filialId?: UUID;
  codigo: string;
  nome: string;
  status: EntityStatus;
  tags: string[];
  observacao?: string;
  createdAt: string;
  createdBy: UUID;
  updatedAt: string;
  updatedBy: UUID;
  version: number;
  deletedAt?: string;
  deletedBy?: UUID;
}

export interface Address {
  tipo: "billing" | "shipping" | "main" | "other";
  cep?: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  pais: string;
}

export interface Contact {
  nome: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  principal?: boolean;
  consentimentoComercial?: boolean;
}

export interface Customer extends BaseMasterRecord {
  kind: "customer";
  tipoPessoa: PersonType;
  documento: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  limiteCredito?: number;
  condicaoPagamento?: string;
  vendedorResponsavelId?: UUID;
  enderecos: Address[];
  contatos: Contact[];
  consentimentos: {
    marketing: boolean;
    compartilhamento: boolean;
    dataHora?: string;
  };
  bloqueioMotivo?: string;
}

export interface Supplier extends BaseMasterRecord {
  kind: "supplier";
  tipoPessoa: PersonType;
  documento: string;
  dadosBancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    chavePix?: string;
  };
  homologacaoStatus: "pending" | "approved" | "rejected" | "expired";
  categorias: string[];
  prazoMedioPagamentoDias?: number;
  risco?: "low" | "medium" | "high";
  avaliacao?: number;
  documentos: Array<{
    tipo: string;
    validade?: string;
    status: "pending" | "valid" | "expired" | "rejected";
    arquivoId?: UUID;
  }>;
  contatos: Contact[];
}

export interface Product extends BaseMasterRecord {
  kind: "product";
  sku: string;
  codigoBarras?: string;
  descricao: string;
  categoriaId?: UUID;
  unidade: string;
  precoVenda: number;
  custo?: number;
  ncm?: string;
  cest?: string;
  origem?: string;
  controlaEstoque: boolean;
  estoqueMinimo?: number;
  controlaLote: boolean;
  controlaValidade: boolean;
  imagens: UUID[];
  composto: boolean;
  componentes?: Array<{ produtoId: UUID; quantidade: number }>;
}

export type MasterRecord = Customer | Supplier | Product;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
