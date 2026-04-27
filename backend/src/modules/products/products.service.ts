import { randomUUID } from 'crypto';
import { CreateProductDto, normalizeCreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { validateProduct } from './product.validators';
import { AuthContext, canManageProduct } from './policies/product.policy';

export interface ProductRepository {
  findBySku(scope: { tenantId: string; empresaId: string; filialId?: string; sku: string }): Promise<Product | null>;
  create(product: Product): Promise<Product>;
}

export interface AuditWriter {
  write(event: {
    tenantId: string;
    empresaId: string;
    filialId?: string;
    entityType: 'Product';
    entityId: string;
    action: string;
    actorId: string;
    before?: unknown;
    after?: unknown;
    correlationId?: string;
  }): Promise<void>;
}

export class ProductsService {
  constructor(private readonly repo: ProductRepository, private readonly audit: AuditWriter) {}

  async create(raw: Record<string, unknown>, ctx: AuthContext, correlationId?: string): Promise<Product> {
    const dto: CreateProductDto = normalizeCreateProductDto(raw);

    if (!canManageProduct(ctx, 'create', dto.empresaId, dto.filialId)) {
      const err = new Error('Sem permissão para cadastrar produto.');
      (err as Error & { status?: number }).status = 403;
      throw err;
    }

    const errors = validateProduct(dto);
    if (errors.length) {
      const err = new Error('Produto inválido.');
      (err as Error & { status?: number; details?: unknown }).status = 422;
      (err as Error & { details?: unknown }).details = errors;
      throw err;
    }

    const duplicate = await this.repo.findBySku({
      tenantId: ctx.tenantId,
      empresaId: dto.empresaId,
      filialId: dto.filialId,
      sku: dto.sku,
    });

    if (duplicate) {
      const err = new Error('SKU já cadastrado para este contexto.');
      (err as Error & { status?: number; details?: unknown }).status = 409;
      (err as Error & { details?: unknown }).details = [{ field: 'sku', message: 'SKU já cadastrado.' }];
      throw err;
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: randomUUID(),
      tenantId: ctx.tenantId,
      empresaId: dto.empresaId,
      filialId: dto.filialId,
      sku: dto.sku,
      barcode: dto.barcode,
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      unitId: dto.unitId,
      costPrice: dto.costPrice,
      salePrice: dto.salePrice,
      ncm: dto.ncm,
      cest: dto.cest,
      origin: dto.origin,
      controlsStock: dto.controlsStock ?? true,
      minimumStock: dto.minimumStock,
      lotSeriesValidity: dto.lotSeriesValidity ?? 'none',
      status: dto.status ?? 'draft',
      isKit: dto.isKit ?? false,
      version: 1,
      createdAt: now,
      createdBy: ctx.userId,
      updatedAt: now,
      updatedBy: ctx.userId,
    };

    const saved = await this.repo.create(product);

    await this.audit.write({
      tenantId: ctx.tenantId,
      empresaId: saved.empresaId,
      filialId: saved.filialId,
      entityType: 'Product',
      entityId: saved.id,
      action: 'product.created',
      actorId: ctx.userId,
      after: { id: saved.id, sku: saved.sku, status: saved.status },
      correlationId,
    });

    return saved;
  }
}
