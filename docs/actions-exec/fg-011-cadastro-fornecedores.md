# FG-011 — Cadastro de Fornecedores

## Objetivo
Gerar implementação base para Cadastro de Fornecedores com UX em etapas, validações, segurança, LGPD, auditoria, backend, frontend, banco e testes.

## Arquivos criados
- `codigo-fonte/backend/src/modules/suppliers/suppliers.controller.ts`
- `codigo-fonte/backend/src/modules/suppliers/suppliers.service.ts`
- `codigo-fonte/backend/src/modules/suppliers/dto/create-supplier.dto.ts`
- `codigo-fonte/backend/src/modules/suppliers/entities/supplier.entity.ts`
- `codigo-fonte/backend/src/common/security/cnpj.ts`
- `codigo-fonte/backend/src/common/security/masking.ts`
- `codigo-fonte/frontend/src/pages/suppliers/SupplierList.tsx`
- `codigo-fonte/frontend/src/pages/suppliers/SupplierForm.tsx`
- `codigo-fonte/frontend/src/services/suppliersApi.ts`
- `codigo-fonte/database/migrations/001_create_suppliers.sql`
- `codigo-fonte/tests/cnpj.spec.ts`
- `codigo-fonte/tests/suppliers.service.spec.ts`

## Comandos seguros

<!-- actions-exec:run -->
```bash
set -euo pipefail
npm install
npm run build
npm test
```

## Checklist
- [x] 3 documentos de entrega criados
- [x] Markdown operacional criado
- [x] ZIP com `codigo-fonte/` criado
- [x] Sem dependências incluídas no ZIP
- [x] Sem segredos ou service account no frontend
- [x] LGPD considerada
- [x] Auditoria prevista
- [x] Testes base criados

## Riscos
- Confirmar stack real antes de aplicar diretamente.
- Definir KMS/Vault para criptografia de dados bancários.
- Validar política de retenção LGPD.
- Integrar validação fiscal oficial em etapa posterior.

## Git sugerido
```bash
git status
git checkout -b feature/fg-011-cadastro-fornecedores
git add docs/actions-exec/fg-011-cadastro-fornecedores.md docs/actions-exec/fg-011-cadastro-fornecedores.zip
git commit -m "feat: adiciona artefatos da FG-011 cadastro de fornecedores"
git push origin feature/fg-011-cadastro-fornecedores
```
