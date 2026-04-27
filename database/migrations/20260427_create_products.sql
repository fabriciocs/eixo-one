CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  filial_id UUID NULL,
  sku VARCHAR(30) NOT NULL,
  barcode VARCHAR(14) NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  category_id UUID NULL,
  unit_id UUID NOT NULL,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  ncm CHAR(8) NULL,
  cest CHAR(7) NULL,
  origin VARCHAR(20) NULL,
  controls_stock BOOLEAN NOT NULL DEFAULT TRUE,
  minimum_stock NUMERIC(14,3) NULL CHECK (minimum_stock IS NULL OR minimum_stock >= 0),
  lot_series_validity VARCHAR(20) NOT NULL DEFAULT 'none',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  is_kit BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  updated_by UUID NOT NULL,
  deleted_at TIMESTAMP NULL,
  deleted_by UUID NULL,
  CONSTRAINT products_status_check CHECK (status IN ('draft','active','inactive','blocked')),
  CONSTRAINT products_lot_rule_check CHECK (lot_series_validity IN ('none','lot','serial','validity','lot_validity')),
  CONSTRAINT products_sku_unique UNIQUE (tenant_id, empresa_id, filial_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_empresa_status ON products (tenant_id, empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products (tenant_id, empresa_id, name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (tenant_id, empresa_id, barcode);

CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  tenant_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  cost_price NUMERIC(14,2) NOT NULL,
  sale_price NUMERIC(14,2) NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  changed_by UUID NOT NULL,
  reason VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  filial_id UUID NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(120) NOT NULL,
  actor_id UUID NOT NULL,
  before_json JSONB NULL,
  after_json JSONB NULL,
  correlation_id VARCHAR(120) NULL,
  ip INET NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
