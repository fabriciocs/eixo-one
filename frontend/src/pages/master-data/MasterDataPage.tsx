import React, { useEffect, useMemo, useState } from "react";

type Kind = "customer" | "supplier" | "product";
type Status = "draft" | "active" | "blocked" | "inactive" | "archived";

interface MasterListItem {
  id: string;
  kind: Kind;
  codigo: string;
  nome: string;
  status: Status;
  version: number;
  documento?: string;
  sku?: string;
}

interface MasterDataPageProps {
  kind: Kind;
  canCreate: boolean;
  canEdit: boolean;
  service: {
    list(kind: Kind, query: { q: string; status?: string; page: number; pageSize: number }): Promise<{ items: MasterListItem[]; total: number }>;
  };
}

const labels: Record<Kind, string> = {
  customer: "Clientes",
  supplier: "Fornecedores",
  product: "Produtos",
};

const statusLabel: Record<Status, string> = {
  draft: "Rascunho",
  active: "Ativo",
  blocked: "Bloqueado",
  inactive: "Inativo",
  archived: "Arquivado",
};

export function MasterDataPage({ kind, canCreate, canEdit, service }: MasterDataPageProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<MasterListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  const title = labels[kind];

  useEffect(() => {
    let active = true;
    setState("loading");
    service.list(kind, { q, status: status || undefined, page: 1, pageSize: 25 })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
        setState(res.items.length ? "ready" : "empty");
      })
      .catch(() => active && setState("error"));
    return () => { active = false; };
  }, [kind, q, status, service]);

  const helper = useMemo(() => {
    if (kind === "customer") return "Cadastre PF/PJ com CPF/CNPJ, endereços, contatos, limite de crédito e consentimentos.";
    if (kind === "supplier") return "Gerencie homologação, documentos, dados bancários mascarados, prazos e avaliações.";
    return "Gerencie SKU, código de barras, NCM/CEST, unidade, preços, estoque, lote e validade.";
  }, [kind]);

  return (
    <main className="master-data-page" aria-labelledby="master-data-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cadastros Mestres</p>
          <h1 id="master-data-title">{title}</h1>
          <p>{helper}</p>
        </div>
        {canCreate && <button type="button" className="primary-action">Novo cadastro</button>}
      </header>

      <section className="filters" aria-label="Filtros de pesquisa">
        <label>
          Buscar
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, código, documento ou SKU" />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </section>

      {state === "loading" && <div role="status" className="skeleton">Carregando cadastros…</div>}
      {state === "error" && <div role="alert" className="error-state">Não foi possível carregar. Verifique conexão e tente novamente.</div>}
      {state === "empty" && <div className="empty-state">Nenhum registro encontrado para os filtros atuais.</div>}

      {state === "ready" && (
        <section aria-label={`${title}: ${total} registros`} className="cards-list">
          {items.map((item) => (
            <article key={item.id} className="record-card">
              <div>
                <strong>{item.nome}</strong>
                <span>{item.codigo}{item.sku ? ` · ${item.sku}` : ""}</span>
              </div>
              <span className={`status-chip status-${item.status}`}>{statusLabel[item.status]}</span>
              {canEdit && <button type="button" aria-label={`Editar ${item.nome}`}>Editar</button>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default MasterDataPage;
