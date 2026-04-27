# Execução operacional — FG-010, FG-011, FG-012

## Escopo
Pacote de implementação para Cadastros Mestres:
- FG-010 Cadastro de clientes
- FG-011 Cadastro de fornecedores
- FG-012 Cadastro de produtos

## Arquivos principais
- codigo-fonte/backend/src/modules/master-data/domain.ts
- codigo-fonte/backend/src/modules/master-data/validators.ts
- codigo-fonte/backend/src/modules/master-data/repository.ts
- codigo-fonte/backend/src/modules/master-data/service.ts
- codigo-fonte/backend/src/modules/master-data/controller.ts
- codigo-fonte/database/migrations/20260427_fg010_fg011_fg012_master_data.sql
- codigo-fonte/frontend/src/pages/master-data/MasterDataPage.tsx
- codigo-fonte/frontend/src/pages/master-data/masterData.css
- docs/01-definicao-produto.md
- docs/02-ux-arquitetura.md
- docs/03-qa-relatorio.md

## Comandos seguros sugeridos

```bash
<!-- actions-exec:run -->
set -euo pipefail
git status --short
git checkout main
git pull --ff-only origin main
git checkout -b feature/fg010-fg011-fg012-master-data
mkdir -p backend/src/modules/master-data frontend/src/pages/master-data database/migrations
cp -R codigo-fonte/backend/src/modules/master-data backend/src/modules/
cp -R codigo-fonte/frontend/src/pages/master-data frontend/src/pages/
cp codigo-fonte/database/migrations/20260427_fg010_fg011_fg012_master_data.sql database/migrations/
git status --short
```

```bash
<!-- actions-exec:run -->
set -euo pipefail
npm run lint
npm test
npm run build
git add backend/src/modules/master-data frontend/src/pages/master-data database/migrations docs/actions-exec
git commit -m "feat(master-data): implementa cadastros mestres fg010 fg011 fg012"
git push -u origin feature/fg010-fg011-fg012-master-data
```

## Checklist
- [x] Requisitos FG-010, FG-011 e FG-012 lidos das planilhas.
- [x] 3 documentos criados.
- [x] Markdown operacional criado.
- [x] Código fonte gerado.
- [x] ZIP gerado com codigo-fonte.
- [ ] Ajustar ao repositório real.
- [ ] Executar lint, testes e build no repositório real.
- [ ] Abrir pull request.

## Riscos
- Necessário adaptar a camada repository ao ORM/Firestore real.
- Necessário validar regras fiscais brasileiras vigentes antes de produção.
- Necessário confirmar padrões de autenticação e permissões existentes.
