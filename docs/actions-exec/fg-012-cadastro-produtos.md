# FG-012 — Cadastro de produtos

## Origem
- Planilha funcional: `funcionalidades_sistemas_gestao_requisitos_com_prompts_codex_fullstack(2).xlsx`
- Planilha UX/UI: `eixoone_planilha_uxui_funcionalidades_completa.xlsx`

## Resumo
Funcionalidade de Cadastros Mestres para definir produtos, SKUs, categorias, unidades, preços, tributação, custo, estoque mínimo, lote, validade, imagens, status e código de barras.

## Arquivos no ZIP
- `codigo-fonte/docs/01-definicao-produto.md`
- `codigo-fonte/docs/02-ux-arquitetura.md`
- `codigo-fonte/docs/03-qa-relatorio.md`
- `codigo-fonte/backend/src/modules/products/**`
- `codigo-fonte/frontend/src/pages/products/**`
- `codigo-fonte/database/migrations/20260427_create_products.sql`
- `codigo-fonte/tests/**`

## Comandos seguros para GitHub Actions
<!-- actions-exec:run -->
```bash
set -euo pipefail
echo "Validando entrega FG-012"
test -d codigo-fonte
test -f codigo-fonte/docs/01-definicao-produto.md
test -f codigo-fonte/docs/02-ux-arquitetura.md
test -f codigo-fonte/docs/03-qa-relatorio.md
test -f codigo-fonte/database/migrations/20260427_create_products.sql
find codigo-fonte -type f | sort
```

## Comandos sugeridos no repositório real
```bash
git status
git checkout -b feature/fg-012-cadastro-produtos
npm install
npm run lint
npm run typecheck
npm test
git add docs/actions-exec/fg-012-cadastro-produtos.md docs/actions-exec/fg-012-cadastro-produtos.zip
git commit -m "feat: entrega FG-012 cadastro de produtos"
git push origin feature/fg-012-cadastro-produtos
```

## Checklist
- [x] FG-012 localizada na planilha funcional.
- [x] Regras UX/UI aplicadas com abordagem mobile-first.
- [x] Fluxos principais sem modais.
- [x] 3 documentos criados.
- [x] ZIP criado com `codigo-fonte/`.
- [x] Backend base criado.
- [x] Frontend base criado.
- [x] Migration SQL criada.
- [x] Testes base criados.
- [ ] Ajustar stack ao repositório real.
- [ ] Executar lint/testes no repositório real.
- [ ] Validar regras fiscais NCM/CEST com responsável humano.

## Riscos
- Regras fiscais podem mudar e exigem fonte oficial.
- Alterações em unidade/preço impactam estoque, venda, compra e fiscal.
- Produto duplicado pode gerar divergência operacional.
- Isolamento tenant/empresa/filial deve ser validado em ambiente real.

## Pendências
- Definir fonte oficial de NCM/CEST.
- Confirmar permissões por perfil.
- Confirmar política de retenção de imagens e histórico.
- Adaptar ao ORM/framework real.
