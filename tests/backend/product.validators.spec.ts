import { isValidGtin, validateProduct } from '../../backend/src/modules/products/product.validators';

describe('FG-012 product validators', () => {
  it('validates GTIN check digit', () => {
    expect(isValidGtin('7894900011517')).toBe(true);
    expect(isValidGtin('7894900011518')).toBe(false);
  });

  it('rejects invalid product payload', () => {
    const errors = validateProduct({
      empresaId: '',
      sku: 'A',
      name: '<script>alert(1)</script>',
      unitId: '',
      costPrice: -1,
      salePrice: -1,
      ncm: '123',
      controlsStock: true,
      lotSeriesValidity: 'none',
      status: 'draft',
      isKit: false,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map((e) => e.field)).toContain('sku');
    expect(errors.map((e) => e.field)).toContain('unitId');
  });
});
