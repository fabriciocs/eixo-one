export interface ProductPayload {
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
  status: 'draft' | 'active' | 'inactive' | 'blocked';
  isKit: boolean;
}

export async function createProduct(payload: ProductPayload): Promise<unknown> {
  const response = await fetch('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Não foi possível salvar o produto.' }));
    throw error;
  }

  return response.json();
}
