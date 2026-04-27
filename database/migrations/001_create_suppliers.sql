CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY,
  corporate_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj VARCHAR(14) NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_bank_accounts (
  id UUID PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  bank_code VARCHAR(10) NOT NULL,
  agency TEXT NOT NULL,
  account_encrypted TEXT NOT NULL,
  account_type VARCHAR(20) NOT NULL,
  pix_key_encrypted TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_documents (
  id UUID PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  document_type VARCHAR(50) NOT NULL,
  storage_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
