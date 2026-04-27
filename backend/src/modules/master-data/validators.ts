import { MasterDataContext, MasterRecord, Product } from "./domain";

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cpf = /^\d{11}$/;
const cnpj = /^\d{14}$/;
const ncm = /^\d{8}$/;
const cest = /^\d{7}$/;
const uf = /^[A-Z]{2}$/;
const barcode = /^\d{8,14}$/;

export class ValidationError extends Error {
  constructor(public readonly details: Record<string, string>) {
    super("Payload inválido");
  }
}

export function normalizeText(value: unknown, max = 150): string {
  const s = String(value ?? "").trim().replace(/\s+/g, " ");
  return s.slice(0, max);
}

export function sanitizeDocument(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function assertContext(ctx: MasterDataContext): void {
  const errors: Record<string, string> = {};
  if (!uuidLike.test(ctx.tenantId)) errors.tenantId = "tenantId inválido";
  if (!uuidLike.test(ctx.empresaId)) errors.empresaId = "empresaId inválido";
  if (!uuidLike.test(ctx.actorId)) errors.actorId = "actorId inválido";
  if (!ctx.correlationId) errors.correlationId = "correlationId obrigatório";
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

export function assertPermission(ctx: MasterDataContext, permission: string): void {
  if (!ctx.permissions.includes(permission) && !ctx.roles.includes("admin")) {
    const err = new Error("Acesso negado");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}

export function validateMasterRecord(record: Partial<MasterRecord>): void {
  const errors: Record<string, string> = {};
  if (!record.kind) errors.kind = "tipo obrigatório";
  if (!record.codigo || normalizeText(record.codigo, 30).length < 2) errors.codigo = "código deve ter 2 a 30 caracteres";
  if (!record.nome || normalizeText(record.nome, 150).length < 2) errors.nome = "nome deve ter 2 a 150 caracteres";
  if (record.observacao && /<script|javascript:/i.test(record.observacao)) errors.observacao = "conteúdo não permitido";
  if (!["draft","active","blocked","inactive","archived"].includes(String(record.status))) errors.status = "status inválido";

  if (record.kind === "customer" || record.kind === "supplier") {
    const doc = sanitizeDocument((record as any).documento);
    if (!cpf.test(doc) && !cnpj.test(doc)) errors.documento = "CPF/CNPJ inválido";
    const contatos = (record as any).contatos ?? [];
    if (!Array.isArray(contatos)) errors.contatos = "contatos deve ser lista";
    contatos.forEach((c: any, i: number) => {
      if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors[`contatos.${i}.email`] = "email inválido";
    });
  }

  if (record.kind === "product") validateProduct(record as Partial<Product>, errors);

  if (Object.keys(errors).length) throw new ValidationError(errors);
}

function validateProduct(product: Partial<Product>, errors: Record<string, string>): void {
  if (!product.sku || normalizeText(product.sku, 60).length < 2) errors.sku = "SKU obrigatório";
  if (product.codigoBarras && !barcode.test(product.codigoBarras)) errors.codigoBarras = "código de barras deve ter 8 a 14 dígitos";
  if (!product.unidade || product.unidade.length > 6) errors.unidade = "unidade obrigatória";
  if (product.precoVenda == null || product.precoVenda < 0) errors.precoVenda = "preço deve ser maior ou igual a zero";
  if (product.custo != null && product.custo < 0) errors.custo = "custo deve ser maior ou igual a zero";
  if (product.ncm && !ncm.test(product.ncm)) errors.ncm = "NCM deve ter 8 dígitos";
  if (product.cest && !cest.test(product.cest)) errors.cest = "CEST deve ter 7 dígitos";
  if (product.componentes?.some((c) => !c.produtoId || c.quantidade <= 0)) errors.componentes = "componentes devem ter produto e quantidade positiva";
}

export function validateAddress(address: any): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!address?.logradouro) errors.logradouro = "logradouro obrigatório";
  if (!address?.cidade) errors.cidade = "cidade obrigatória";
  if (!address?.uf || !uf.test(address.uf)) errors.uf = "UF inválida";
  if (!address?.pais) errors.pais = "país obrigatório";
  return errors;
}
