# FG-003 - Especificacao Tecnica Backend

## Contratos e schemas
- Novo contrato compartilhado em `packages/shared_contracts/src/v1/base-governance/roles.ts`.
- Exportacao central adicionada em `packages/shared_contracts/src/index.ts`.
- Testes de contrato atualizados em `packages/shared_contracts/test/contracts.test.ts`.

## Endpoints entregues
- `GET /v1/governance/roles`
- `POST /v1/governance/roles`
- `PATCH /v1/governance/roles/:roleId`
- `GET /v1/governance/permissions/catalog`
- `GET /v1/governance/audit-events`

## Componentes principais
- `BaseGovernanceService`: cria/edita roles, lista catalogo e auditoria, valida permissoes conhecidas e unicidade.
- `authorizationMiddleware`: agora resolve permissao efetiva combinando claims + grant persistido + roles persistidas.
- `GovernanceService`: valida `roleKeys` de grants e bloqueia autoelevacao.
- `FirestoreBaseGovernanceRepository`: persiste roles em `roles` e le auditoria em `audit_logs`.
- `InMemoryBaseGovernanceRepository`: seed para testes e modo memory.

## Regras server-side relevantes
- `deny by default` por rota protegida.
- validacao de payload com zod.
- controle de concorrencia otimista por `expectedVersion`.
- auditoria em criacao e atualizacao de role.
- validacao de `roleKeys` atribuidas a grants.

## Estruturas persistidas
- `roles` (root collection):
  - `roleId`, `tenantId`, `key`, `name`, `description`
  - `permissionKeys`, `companyIds`, `establishmentIds`, `costCenterIds`
  - `status`, `version`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
- `audit_logs` (root collection):
  - `contractVersion`, `tenantId`, `actorUserId`
  - `entityType`, `entityId`, `action`, `severity`
  - `correlationId`, `requestId`, `before`, `after`, `metadata`, `createdAt`

## Decisoes tecnicas
- A autorizacao nao ficou dentro do service de roles; ficou centralizada no middleware de rota.
- O grant persistido complementa as claims, em vez de substitui-las.
- As roles inativas permanecem catalogadas, mas nao concedem permissao efetiva.

## Pendencias tecnicas
- Exclusao logica e bloqueio de remocao de role ainda nao existem.
- Auditoria ainda nao registra IP e user-agent no payload salvo.
- Owner-level policy por registro de negocio permanece para fases futuras.
