import React, { useState } from 'react';
import { createProduct, ProductPayload } from '../services/productsApi';

type Props = {
  empresaId: string;
  canCreate: boolean;
  onSaved?: (product: unknown) => void;
};

const initialForm: ProductPayload = {
  empresaId: '',
  sku: '',
  name: '',
  unitId: '',
  costPrice: 0,
  salePrice: 0,
  controlsStock: true,
  lotSeriesValidity: 'none',
  status: 'draft',
  isKit: false,
};

export function ProductForm({ empresaId, canCreate, onSaved }: Props) {
  const [form, setForm] = useState<ProductPayload>({ ...initialForm, empresaId });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function update<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (form.sku.trim().length < 2 || form.sku.trim().length > 30) next.sku = 'SKU deve ter entre 2 e 30 caracteres.';
    if (form.name.trim().length < 2 || form.name.trim().length > 150) next.name = 'Nome deve ter entre 2 e 150 caracteres.';
    if (!form.unitId) next.unitId = 'Selecione a unidade de medida.';
    if (form.costPrice < 0) next.costPrice = 'Preço de custo deve ser maior ou igual a zero.';
    if (form.salePrice < 0) next.salePrice = 'Preço de venda deve ser maior ou igual a zero.';
    if (form.ncm && !/^\d{8}$/.test(form.ncm)) next.ncm = 'NCM deve conter 8 dígitos.';
    if (form.cest && !/^\d{7}$/.test(form.cest)) next.cest = 'CEST deve conter 7 dígitos.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreate) {
      setMessage('Você não tem permissão para cadastrar produtos.');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    setMessage('');
    try {
      const saved = await createProduct({ ...form, sku: form.sku.trim().toUpperCase(), name: form.name.trim() });
      setMessage('Produto salvo com sucesso.');
      onSaved?.(saved);
    } catch (error: any) {
      const fieldErrors = Array.isArray(error?.details)
        ? Object.fromEntries(error.details.map((item: any) => [item.field, item.message]))
        : {};
      setErrors(fieldErrors);
      setMessage(error?.message ?? 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form aria-label="Cadastro de produto" onSubmit={submit} className="product-form">
      {message && <div role="status" aria-live="polite">{message}</div>}

      <section aria-labelledby="dados-principais">
        <h2 id="dados-principais">Dados principais</h2>
        <label>
          SKU
          <input value={form.sku} onChange={(e) => update('sku', e.target.value)} aria-invalid={Boolean(errors.sku)} />
          {errors.sku && <small role="alert">{errors.sku}</small>}
        </label>

        <label>
          Código de barras/GTIN
          <input value={form.barcode ?? ''} onChange={(e) => update('barcode', e.target.value)} aria-invalid={Boolean(errors.barcode)} />
          {errors.barcode && <small role="alert">{errors.barcode}</small>}
        </label>

        <label>
          Nome
          <input value={form.name} onChange={(e) => update('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
          {errors.name && <small role="alert">{errors.name}</small>}
        </label>

        <label>
          Unidade de medida
          <input value={form.unitId} onChange={(e) => update('unitId', e.target.value)} aria-invalid={Boolean(errors.unitId)} />
          {errors.unitId && <small role="alert">{errors.unitId}</small>}
        </label>
      </section>

      <section aria-labelledby="fiscal">
        <h2 id="fiscal">Fiscal</h2>
        <label>NCM<input value={form.ncm ?? ''} onChange={(e) => update('ncm', e.target.value.replace(/\D/g, ''))} /></label>
        <label>CEST<input value={form.cest ?? ''} onChange={(e) => update('cest', e.target.value.replace(/\D/g, ''))} /></label>
      </section>

      <section aria-labelledby="precos">
        <h2 id="precos">Preços</h2>
        <label>Preço de custo<input type="number" min="0" value={form.costPrice} onChange={(e) => update('costPrice', Number(e.target.value))} /></label>
        <label>Preço de venda<input type="number" min="0" value={form.salePrice} onChange={(e) => update('salePrice', Number(e.target.value))} /></label>
      </section>

      <button type="submit" disabled={saving || !canCreate}>
        {saving ? 'Salvando...' : 'Salvar produto'}
      </button>
    </form>
  );
}
