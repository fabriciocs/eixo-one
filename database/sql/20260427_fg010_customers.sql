-- FG-010 Cadastro de clientes
-- Ajuste tipos, schema e nomes conforme o padrão real do repositório antes de aplicar.

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  filial_id UUID NULL,
  codigo VARCHAR(30) NULL,
  tipo_pessoa VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('PF', 'PJ', 'ESTRANGEIRO')),
  nome VARCHAR(150) NOT NULL,
  nome_normalizado VARCHAR(180) NOT NULL,
  nome_fantasia VARCHAR(150) NULL,
  cpf_cnpj VARCHAR(32) NULL,
  cpf_cnpj_normalizado VARCHAR(20) NULL,
  documento_estrangeiro VARCHAR(60) NULL,
  email VARCHAR(180) NULL,
  email_normalizado VARCHAR(180) NULL,
  telefone VARCHAR(30) NULL,
  telefone_normalizado VARCHAR(30) NULL,
  limite_credito_centavos BIGINT NOT NULL DEFAULT 0 CHECK (limite_credito_centavos >= 0),
  vendedor_responsavel_id UUID NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'bloqueado', 'inativo')),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacao TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  updated_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_customers_document_active
  ON customers (tenant_id, empresa_id, cpf_cnpj_normalizado)
  WHERE deleted_at IS NULL AND cpf_cnpj_normalizado IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_customers_codigo_active
  ON customers (tenant_id, empresa_id, codigo)
  WHERE deleted_at IS NULL AND codigo IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_customers_list
  ON customers (tenant_id, empresa_id, status, nome_normalizado)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_customers_scope
  ON customers (tenant_id, empresa_id, filial_id, tipo_pessoa)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_customers_tags_gin
  ON customers USING GIN (tags);

-- Auditoria recomendada se o repositório ainda não possuir tabela central.
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  empresa_id UUID NULL,
  filial_id UUID NULL,
  actor_id UUID NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(120) NOT NULL,
  before_json JSONB NULL,
  after_json JSONB NULL,
  diff_json JSONB NULL,
  ip VARCHAR(80) NULL,
  user_agent TEXT NULL,
  correlation_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_events_entity
  ON audit_events (tenant_id, entity_type, entity_id, created_at DESC);
