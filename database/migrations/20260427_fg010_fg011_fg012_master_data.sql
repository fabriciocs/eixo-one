-- FG-010, FG-011, FG-012: cadastros mestres.
-- PostgreSQL. Ajustar nomes/schema conforme padrão real do repositório.

CREATE TABLE IF NOT EXISTS master_data_records (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  empresa_id uuid NOT NULL,
  filial_id uuid NULL,
  kind varchar(20) NOT NULL CHECK (kind IN ('customer','supplier','product')),
  codigo varchar(30) NOT NULL,
  nome varchar(150) NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('draft','active','blocked','inactive','archived')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL,
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL,
  updated_by uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_master_data_codigo
  ON master_data_records (tenant_id, empresa_id, COALESCE(filial_id, '00000000-0000-0000-0000-000000000000'::uuid), kind, codigo)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_master_data_search ON master_data_records USING gin (to_tsvector('portuguese', nome || ' ' || codigo));
CREATE INDEX IF NOT EXISTS ix_master_data_payload ON master_data_records USING gin (payload jsonb_path_ops);
CREATE INDEX IF NOT EXISTS ix_master_data_status ON master_data_records (tenant_id, empresa_id, kind, status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  empresa_id uuid NOT NULL,
  filial_id uuid NULL,
  actor_id uuid NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid NOT NULL,
  action varchar(80) NOT NULL,
  before_payload jsonb NULL,
  after_payload jsonb NULL,
  diff_payload jsonb NULL,
  ip inet NULL,
  user_agent text NULL,
  correlation_id varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_entity ON audit_events (tenant_id, empresa_id, entity_type, entity_id, created_at DESC);
