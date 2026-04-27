# fg-010-011-012-cadastros-mestres-ajustes

## Premissas
Repositório alvo: `fabriciocs/eixo-one`.
Branch base esperada: `main`.
Branch sugerida: `feature/fg-010-011-012-cadastros-mestres-ajustes`.
Data de geração: 2026-04-27.
Fonte de requisitos: planilhas enviadas pelo usuário.

## Observação sobre Git
A tentativa de `git ls-remote`/pull via rede direta falhou neste ambiente com `Could not resolve host: github.com`.
O pacote abaixo preserva comandos seguros para executar no ambiente real do repositório.

## Arquivos criados/alterados no pacote
- `codigo-fonte/backend/src/modules/master-data/master-data.types.ts`
- `codigo-fonte/backend/src/modules/master-data/master-data.validation.ts`
- `codigo-fonte/backend/src/modules/master-data/master-data.audit.ts`
- `codigo-fonte/backend/src/modules/master-data/master-data.repository.ts`
- `codigo-fonte/backend/src/modules/master-data/master-data.service.ts`
- `codigo-fonte/backend/src/modules/master-data/master-data.controller.ts`
- `codigo-fonte/frontend/src/features/master-data/MasterDataPage.tsx`
- `codigo-fonte/database/migrations/20260427_fg010_fg011_fg012_master_data.sql`
- `codigo-fonte/tests/master-data.validation.spec.ts`
- `codigo-fonte/docs/01-definicao-produto.md`
- `codigo-fonte/docs/02-ux-arquitetura.md`
- `codigo-fonte/docs/03-qa-relatorio.md`

## Comandos para GitHub Actions

<!-- actions-exec:run -->
```bash
set -euo pipefail

git status --short
git checkout main
git pull --ff-only origin main
git checkout -b feature/fg-010-011-012-cadastros-mestres-ajustes

mkdir -p backend/src/modules/master-data frontend/src/features/master-data database/migrations tests docs/fg-010-011-012

cp -R docs/actions-exec/fg-010-011-012-cadastros-mestres-ajustes/codigo-fonte/backend/src/modules/master-data/* backend/src/modules/master-data/
cp -R docs/actions-exec/fg-010-011-012-cadastros-mestres-ajustes/codigo-fonte/frontend/src/features/master-data/* frontend/src/features/master-data/
cp -R docs/actions-exec/fg-010-011-012-cadastros-mestres-ajustes/codigo-fonte/database/migrations/* database/migrations/
cp -R docs/actions-exec/fg-010-011-012-cadastros-mestres-ajustes/codigo-fonte/tests/* tests/
cp -R docs/actions-exec/fg-010-011-012-cadastros-mestres-ajustes/codigo-fonte/docs/* docs/fg-010-011-012/

npm install
npm run lint --if-present
npm run test --if-present
npm run build --if-present

git status --short
git add backend/src/modules/master-data frontend/src/features/master-data database/migrations tests docs/fg-010-011-012
git commit -m "feat: ajusta FG-010 FG-011 FG-012 cadastros mestres"
git push -u origin feature/fg-010-011-012-cadastros-mestres-ajustes
```

## Checklist
- [x] Planilhas lidas.
- [x] Requisitos FG-010, FG-011 e FG-012 extraídos.
- [x] Regras UX/UI aplicadas.
- [x] Backend seguro gerado.
- [x] Frontend mobile-first gerado.
- [x] Migration SQL gerada.
- [x] Testes críticos gerados.
- [x] 3 documentos criados.
- [x] ZIP criado sem dependências e sem segredos.
- [ ] Pull real da main executado no ambiente do repositório.
- [ ] Commit/push executado no ambiente do repositório.

## Riscos e pendências
- Validar adaptação de imports ao framework real do repositório.
- Substituir repositório em memória por ORM/DAO real.
- Definir KMS/Vault para criptografia de dados bancários.
- Validar política de retenção LGPD com jurídico.
