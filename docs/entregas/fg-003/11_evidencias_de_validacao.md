# FG-003 - Evidencias de Validacao

## Validacoes executadas em 2026-04-27

### Flutter
- Comando: `flutter analyze`
- Resultado: `sucesso`

- Comando: `flutter test`
- Resultado: `sucesso`
- Evidencia resumida: `11 testes aprovados`

### Monorepo Node/TypeScript
- Comando: `npm run lint`
- Resultado: `sucesso`

- Comando: `npm run typecheck`
- Resultado: `sucesso`

- Comando: `npm run test`
- Resultado: `sucesso`
- Evidencia resumida:
  - `packages/shared_contracts`: `9 testes aprovados`
  - `backend/api_node`: `29 testes aprovados`

## Validacao com bloqueio externo
- Comando: `npm run test:emulators:rules`
- Resultado: `nao concluido`
- Motivo real: `ECONNREFUSED 127.0.0.1:8088`
- Interpretacao: o teste depende de Firestore emulator ativo no ambiente local.

## Evidencias funcionais adicionais
- O backend aceita `roles.read` derivado de role persistida atribuida via grant, validado por teste de integracao.
- A UI Flutter apresenta:
  - estado de acesso negado para operador sem `roles.read`
  - catalogo administrativo para admin
  - trilha seed de auditoria
  - atribuicao de roles e overrides em grants

## Arquivos relevantes alterados
- `backend/api_node/src/middlewares/authorization.middleware.ts`
- `backend/api_node/src/modules/base-governance/**`
- `backend/api_node/src/modules/governance/application/governance-service.ts`
- `backend/api_node/src/routes/register-routes.ts`
- `packages/shared_contracts/src/v1/base-governance/roles.ts`
- `apps/mobile_flutter/lib/features/app_shell/presentation/pages/roles_page.dart`
- `apps/mobile_flutter/lib/features/app_shell/presentation/pages/audit_page.dart`
- `apps/mobile_flutter/lib/features/governance/presentation/pages/grants_page.dart`
- `scripts/firebase/emulator-shared.mjs`
- `scripts/firebase/seed-emulators.mjs`
