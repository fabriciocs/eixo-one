export type ProductAction = 'read' | 'create' | 'update' | 'delete' | 'audit';

export interface AuthContext {
  userId: string;
  tenantId: string;
  empresaIds: string[];
  filialIds?: string[];
  scopes: string[];
}

export function canManageProduct(ctx: AuthContext, action: ProductAction, empresaId: string, filialId?: string): boolean {
  if (!ctx.tenantId || !ctx.userId) return false;
  if (!ctx.empresaIds.includes(empresaId)) return false;
  if (filialId && ctx.filialIds?.length && !ctx.filialIds.includes(filialId)) return false;
  return ctx.scopes.includes(`products:${action}`) || ctx.scopes.includes('products:*');
}
