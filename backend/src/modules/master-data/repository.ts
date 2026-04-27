import { MasterRecord, Page, UUID } from "./domain";

export interface MasterDataFilters {
  tenantId: UUID;
  empresaId: UUID;
  filialId?: UUID;
  kind?: MasterRecord["kind"];
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface MasterDataRepository {
  list(filters: MasterDataFilters): Promise<Page<MasterRecord>>;
  findById(tenantId: UUID, empresaId: UUID, id: UUID): Promise<MasterRecord | null>;
  findDuplicate(record: Partial<MasterRecord>): Promise<MasterRecord | null>;
  create(record: MasterRecord): Promise<MasterRecord>;
  update(id: UUID, expectedVersion: number, patch: Partial<MasterRecord>): Promise<MasterRecord>;
  softDelete(id: UUID, actorId: UUID): Promise<void>;
}

export class InMemoryMasterDataRepository implements MasterDataRepository {
  private rows = new Map<UUID, MasterRecord>();

  async list(filters: MasterDataFilters): Promise<Page<MasterRecord>> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const q = filters.q?.toLowerCase();
    let items = [...this.rows.values()].filter((r) =>
      r.tenantId === filters.tenantId &&
      r.empresaId === filters.empresaId &&
      !r.deletedAt &&
      (!filters.filialId || r.filialId === filters.filialId) &&
      (!filters.kind || r.kind === filters.kind) &&
      (!filters.status || r.status === filters.status) &&
      (!q || r.nome.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q))
    );
    items = items.sort((a, b) => a.nome.localeCompare(b.nome));
    const total = items.length;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize };
  }

  async findById(tenantId: UUID, empresaId: UUID, id: UUID): Promise<MasterRecord | null> {
    const row = this.rows.get(id);
    if (!row || row.tenantId !== tenantId || row.empresaId !== empresaId || row.deletedAt) return null;
    return row;
  }

  async findDuplicate(record: Partial<MasterRecord>): Promise<MasterRecord | null> {
    return [...this.rows.values()].find((r: any) =>
      !r.deletedAt &&
      r.tenantId === record.tenantId &&
      r.empresaId === record.empresaId &&
      r.kind === record.kind &&
      (r.codigo === record.codigo || (record as any).documento && r.documento === (record as any).documento || (record as any).sku && r.sku === (record as any).sku)
    ) ?? null;
  }

  async create(record: MasterRecord): Promise<MasterRecord> {
    this.rows.set(record.id, record);
    return record;
  }

  async update(id: UUID, expectedVersion: number, patch: Partial<MasterRecord>): Promise<MasterRecord> {
    const current = this.rows.get(id);
    if (!current) throw new Error("registro não encontrado");
    if (current.version !== expectedVersion) {
      const e = new Error("conflito de versão");
      (e as Error & { status?: number }).status = 409;
      throw e;
    }
    const next = { ...current, ...patch, version: current.version + 1 } as MasterRecord;
    this.rows.set(id, next);
    return next;
  }

  async softDelete(id: UUID, actorId: UUID): Promise<void> {
    const current = this.rows.get(id);
    if (current) this.rows.set(id, { ...current, deletedAt: new Date().toISOString(), deletedBy: actorId } as MasterRecord);
  }
}
