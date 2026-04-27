import { CreateProductDto } from './dto/create-product.dto';

export type ValidationError = { field: string; message: string };

export function isValidGtin(value: string): boolean {
  if (!/^\d{8,14}$/.test(value)) return false;
  const digits = value.split('').map(Number);
  const check = digits.pop()!;
  let sum = 0;
  let weight = 3;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10 === check;
}

export function validateProduct(dto: CreateProductDto): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!dto.empresaId) errors.push({ field: 'empresaId', message: 'Empresa é obrigatória.' });
  if (!/^.{2,30}$/.test(dto.sku)) errors.push({ field: 'sku', message: 'SKU deve ter entre 2 e 30 caracteres.' });
  if (/<script|<[^>]+>/i.test(dto.sku)) errors.push({ field: 'sku', message: 'SKU não pode conter HTML.' });
  if (!/^.{2,150}$/.test(dto.name)) errors.push({ field: 'name', message: 'Nome deve ter entre 2 e 150 caracteres.' });
  if (/<script|<[^>]+>/i.test(dto.name)) errors.push({ field: 'name', message: 'Nome não pode conter HTML.' });
  if (!dto.unitId) errors.push({ field: 'unitId', message: 'Unidade de medida é obrigatória.' });
  if (dto.barcode && !isValidGtin(dto.barcode)) errors.push({ field: 'barcode', message: 'Código de barras/GTIN inválido.' });
  if (dto.costPrice < 0) errors.push({ field: 'costPrice', message: 'Preço de custo deve ser maior ou igual a zero.' });
  if (dto.salePrice < 0) errors.push({ field: 'salePrice', message: 'Preço de venda deve ser maior ou igual a zero.' });
  if (dto.ncm && !/^\d{8}$/.test(dto.ncm)) errors.push({ field: 'ncm', message: 'NCM deve conter 8 dígitos.' });
  if (dto.cest && !/^\d{7}$/.test(dto.cest)) errors.push({ field: 'cest', message: 'CEST deve conter 7 dígitos.' });
  if (dto.minimumStock !== undefined && dto.minimumStock < 0) errors.push({ field: 'minimumStock', message: 'Estoque mínimo deve ser maior ou igual a zero.' });

  return errors;
}
