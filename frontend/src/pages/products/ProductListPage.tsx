import React from 'react';

export function ProductListPage() {
  return (
    <main aria-labelledby="products-title">
      <header>
        <h1 id="products-title">Produtos</h1>
        <p>Cadastre e acompanhe SKUs, preços, fiscal, estoque e status.</p>
        <a href="/products/new">Novo produto</a>
      </header>

      <section aria-label="Filtros de produtos">
        <label>Buscar<input placeholder="SKU, nome ou código de barras" /></label>
        <label>Status<select><option>Todos</option><option>Ativo</option><option>Rascunho</option></select></label>
      </section>

      <section aria-live="polite">
        <p>Nenhum produto encontrado.</p>
        <a href="/products/new">Cadastrar primeiro produto</a>
      </section>
    </main>
  );
}
