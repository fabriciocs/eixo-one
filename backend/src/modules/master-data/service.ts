import { randomUUID } from "crypto";
import { AuditEvent, MasterDataContext, MasterRecord } from "./domain";
import { MasterDataRepository, MasterDataFilters } from "./repository";
import { assertContext, assertPermission, validateMasterRecord, normalizeText, sanitizeDocument } from "./validators";

export interface AuditWriter {
  append(event: AuditEvent): Promise<void>;
}

export class MasterDataService {
  constructor(private readonly repo: MasterDataRepository, private readonly audit: AuditWriter) {}

  async list(ctx: MasterDataContext, filters: Omit<MasterDataFilters, "tenantId" | "empresaId" | "filialId">) {
    assertContext(ctx);
    assertPermission(ctx, "master-data.read");
    return this.repo.list({ ...filters, tenantId: ctx.tenantId, empresaId: ctx.empresaId, filialId: ctx.filialId });
  }

  async create(ctx: MasterDataContext, input: Partial<MasterRecord>) {
    assertContext(ctx);
    assertPermission(ctx, `master-data.${input.kind}.create`);
    const now = new Date().toISOString();
    const record = normalizeRecord({
      ...input,
      id: randomUUID(),
      tenantId: ctx.tenantId,
      empresaId: ctx.empresaId,
      filialId: ctx.filialId,
      createdAt: now,
      createdBy: ctx.actorId,
      updatedAt: now,
      updatedBy: ctx.actorId,
      version: 1,
    } as Partial<MasterRecord>) as MasterRecord;

    validateMasterRecord(record);
    const duplicate = await this.repo.findDuplicate(record);
    if (duplicate) {
      const e = new Error("registro duplicado");
      (e as Error & { status?: number }).status = 409;
      throw e;
    }
    const saved = await this.repo.create(record);
    await this.audit.append(this.auditEvent(ctx, saved.kind, saved.id, "create", undefined, maskSensitive(saved)));
    return saved;
  }

  async update(ctx: MasterDataContext, id: string, expectedVersion: number, patch: Partial<MasterRecord>) {
    assertContext(ctx);
    const current = await this.repo.findById(ctx.tenantId, ctx.empresaId, id);
    if (!current) {
      const e = new Error("registro não encontrado");
      (e as Error & { status?: number }).status = 404;
      throw e;
    }
    assertPermission(ctx, `master-data.${current.kind}.update`);
    const normalized = normalizeRecord({ ...current, ...patch, updatedAt: new Date().toISOString(), updatedBy: ctx.actorId } as Partial<MasterRecord>);
    validateMasterRecord(normalized);
    const saved = await this.repo.update(id, expectedVersion, normalized);
    await this.audit.append(this.auditEvent(ctx, saved.kind, saved.id, "update", maskSensitive(current), maskSensitive(saved)));
    return saved;
  }

  async block(ctx: MasterDataContext, id: string, motivo: string) {
    assertContext(ctx);
    const current = await this.repo.findById(ctx.tenantId, ctx.empresaId, id);
    if (!current) throw Object.assign(new Error("registro não encontrado"), { status: 404 });
    assertPermission(ctx, `master-data.${current.kind}.block`);
    return this.update(ctx, id, current.version, { status: "blocked", observacao: motivo } as Partial<MasterRecord>);
  }

  async softDelete(ctx: MasterDataContext, id: string) {
    assertContext(ctx);
    const current = await this.repo.findById(ctx.tenantId, ctx.empresaId, id);
    if (!current) throw Object.assign(new Error("registro não encontrado"), { status: 404 });
    assertPermission(ctx, `master-data.${current.kind}.delete`);
    if (current.status === "active") throw Object.assign(new Error("bloqueie/inative antes de excluir"), { status: 422 });
    await this.repo.softDelete(id, ctx.actorId);
    await this.audit.append(this.auditEvent(ctx, current.kind, id, "soft_delete", maskSensitive(current), undefined));
  }

  private auditEvent(ctx: MasterDataContext, entityType: string, entityId: string, action: string, before?: unknown, after?: unknown): AuditEvent {
    return { id: randomUUID(), tenantId: ctx.tenantId, empresaId: ctx.empresaId, filialId: ctx.filialId, actorId: ctx.actorId, entityType, entityId, action, before, after, correlationId: ctx.correlationId, createdAt: new Date().toISOString() };
  }
}

export function normalizeRecord(record: Partial<MasterRecord>): Partial<MasterRecord> {
  const base: any = {
    ...record,
    codigo: normalizeText(record.codigo, 30).toUpperCase(),
    nome: normalizeText(record.nome, 150),
    tags: Array.isArray(record.tags) ? record.tags.map((t) => normalizeText(t, 30).toLowerCase()).filter(Boolean) : [],
    observacao: record.observacao ? normalizeText(record.observacao, 1000) : undefined,
  };
  if (base.documento) base.documento = sanitizeDocument(base.documento);
  if (base.sku) base.sku = normalizeText(base.sku, 60).toUpperCase();
  if (base.codigoBarras) base.codigoBarras = sanitizeDocument(base.codigoBarras);
  if (base.ncm) base.ncm = sanitizeDocument(base.ncm);
  if (base.cest) base.cest = sanitizeDocument(base.cest);
  return base;
}

export function maskSensitive(record: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(record));
  if (clone.documento) clone.documento = `***${String(clone.documento).slice(-4)}`;
  if (clone.dadosBancarios) clone.dadosBancarios = { ...clone.dadosBancarios, agencia: "***", conta: "***", chavePix: clone.dadosBancarios.chavePix ? "***" : undefined };
  return clone;
}
