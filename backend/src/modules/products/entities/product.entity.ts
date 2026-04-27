export type ProductStatus = 'draft' | 'active' | 'inactive' | 'blocked';

export interface Product {
  id: string;
  tenantId: string;
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
  controlsStock: boolean;
  minimumStock?: number;
  lotSeriesValidity: 'none' | 'lot' | 'serial' | 'validity' | 'lot_validity';
  status: ProductStatus;
  isKit: boolean;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}
