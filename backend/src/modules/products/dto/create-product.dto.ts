export interface CreateProductDto {
  empresaId: string;
  filialId?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitId: string;
  costPrice: number;
  salePrice: number;
  ncm?: string;
  cest?: string;
  origin?: string;
  controlsStock?: boolean;
  minimumStock?: number;
  lotSeriesValidity?: 'none' | 'lot' | 'serial' | 'validity' | 'lot_validity';
  status?: 'draft' | 'active' | 'inactive' | 'blocked';
  isKit?: boolean;
}

const ALLOWED_KEYS = new Set([
  'empresaId','filialId','sku','barcode','name','description','categoryId','unitId',
  'costPrice','salePrice','ncm','cest','origin','controlsStock','minimumStock',
  'lotSeriesValidity','status','isKit'
]);

export function normalizeCreateProductDto(input: Record<string, unknown>): CreateProductDto {
  for (const key of Object.keys(input)) {
    if (!ALLOWED_KEYS.has(key)) throw new Error(`Campo não permitido: ${key}`);
  }

  return {
    empresaId: String(input.empresaId ?? ''),
    filialId: input.filialId ? String(input.filialId) : undefined,
    sku: String(input.sku ?? '').trim().toUpperCase(),
    barcode: input.barcode ? String(input.barcode).trim() : undefined,
    name: String(input.name ?? '').trim(),
    description: input.description ? String(input.description).trim() : undefined,
    categoryId: input.categoryId ? String(input.categoryId) : undefined,
    unitId: String(input.unitId ?? ''),
    costPrice: Number(input.costPrice ?? 0),
    salePrice: Number(input.salePrice ?? 0),
    ncm: input.ncm ? String(input.ncm).replace(/\D/g, '') : undefined,
    cest: input.cest ? String(input.cest).replace(/\D/g, '') : undefined,
    origin: input.origin ? String(input.origin) : undefined,
    controlsStock: Boolean(input.controlsStock ?? true),
    minimumStock: input.minimumStock === undefined ? undefined : Number(input.minimumStock),
    lotSeriesValidity: (input.lotSeriesValidity as CreateProductDto['lotSeriesValidity']) ?? 'none',
    status: (input.status as CreateProductDto['status']) ?? 'draft',
    isKit: Boolean(input.isKit ?? false),
  };
}
