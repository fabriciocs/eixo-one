# Shared Contracts

## Objetivo

`packages/shared_contracts` centraliza contratos versionados para reduzir drift entre API, Functions e clientes.

## O que existe em `v1`

- `metadata.ts`: `tenantId`, `userId`, `correlationId`, `requestId`, `createdAt`, `updatedAt`, `version`, `idempotencyKey`.
- `errors.ts`: codigos padronizados.
- `api-response.ts`: envelopes de sucesso e erro.
- `audit.ts`: evento de auditoria padronizado.
- `users.ts`: schemas e tipos do modulo de usuarios.

## Regras de evolucao

- Nunca altere contrato publico de forma breaking sem criar nova versao.
- Mudancas additive podem permanecer na mesma versao.
- Novas colecoes, eventos e endpoints devem reaproveitar metadados e envelopes existentes.
- Validacao de API deve usar os mesmos schemas sempre que possivel.
