# FG-010 — Pacote de implementação: Cadastro de clientes

Este pacote contém uma implementação-base adaptável para a funcionalidade **FG-010 — Cadastro de clientes**.

## Premissas

- Sistema multiempresa/multifilial.
- Autenticação já existente.
- `tenantId`, `actorId`, permissões, empresa e filial vêm do contexto autenticado.
- Backend TypeScript modular ou Cloud Functions.
- Frontend Flutter/Dart mobile-first.
- Banco SQL ou Firestore, com fragmentos de referência incluídos.
- Auditoria append-only existente ou implementável por módulo compartilhado.

## Conteúdo

- `contracts/openapi/fg-010-customers.openapi.yaml`: contrato REST.
- `backend/typescript/src/modules/customers`: tipos, validações, service, controller e rotas.
- `backend/typescript/test/customers`: testes de validação.
- `backend/firebase`: fragmentos de rules e indexes.
- `database/sql`: migration SQL de referência.
- `frontend/flutter/lib/features/customers`: modelo, repository e telas.
- `frontend/flutter/test/features/customers`: teste de validação.
- `tools/validate-fg010-package.sh`: validação segura de pacote.

## Como adaptar no repositório real

1. Criar branch `feature/fg-010`.
2. Copiar arquivos conforme arquitetura real.
3. Ajustar imports e injeção de dependência.
4. Conectar `CustomerRepository` à implementação real.
5. Conectar `AuditWriter` ao módulo de auditoria existente.
6. Conectar `Authorizer` às policies existentes.
7. Aplicar migration SQL ou indexes/rules Firestore.
8. Rodar lint, typecheck, testes unitários, integração e frontend.

## Controles implementados no desenho

- Validação CPF/CNPJ.
- Normalização de documento, e-mail, telefone e nome.
- Rejeição de payload com campos inesperados na camada de controller.
- Autorização por ação, tenant, empresa e filial.
- Unicidade lógica de documento por tenant/empresa.
- Máquina de status.
- Auditoria para criação, edição, status e exclusão lógica.
- Soft delete.
- Paginação e filtros server-side.
- Mascaramento de dados sensíveis.
