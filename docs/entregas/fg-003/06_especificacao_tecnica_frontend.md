# FG-003 - Especificacao Tecnica Frontend

## Camadas criadas/atualizadas
- `apps/mobile_flutter/lib/features/base_governance/models/base_governance_models.dart`
- `apps/mobile_flutter/lib/features/base_governance/repositories/base_governance_repository.dart`
- `apps/mobile_flutter/lib/features/base_governance/domain/base_governance_permissions.dart`
- `apps/mobile_flutter/lib/features/app_shell/presentation/pages/roles_page.dart`
- `apps/mobile_flutter/lib/features/app_shell/presentation/pages/audit_page.dart`
- `apps/mobile_flutter/lib/features/governance/presentation/pages/grants_page.dart`

## Estrategia de dados
- Provider `baseGovernanceRepositoryProvider` escolhe:
  - API real quando `USE_GOVERNANCE_API` + Firebase autenticado.
  - repositorio em memoria para demo/testes locais.
- O repositorio em memoria agora também aplica autorizacao local coerente com `roles.read`, `roles.manage` e `audit.read`.

## Roles Page
- `ConsumerStatefulWidget` com carga paralela de:
  - roles
  - catalogo de permissoes
  - `accessibleScopes`
- Calcula permissao efetiva local da sessao usando grant atual + roles carregadas.
- Permite criar/editar perfil na mesma pagina com validacao minima de formulario.

## Audit Page
- Lista eventos auditaveis com filtros server-side.
- Exibe severidade, actor, correlacao e snapshots de alteracao.

## Grants Page
- Continua usando o repositorio de governanca para grant/contexto.
- Passa a usar o catalogo administrativo para selecionar roles e overrides.
- Exibe preview de permissao efetiva antes do salvamento.

## Testes Flutter adicionados/atualizados
- `test/features/governance/governance_pages_test.dart`
- `test/features/base_governance/base_governance_home_page_test.dart`

## Limitacoes conhecidas
- A sessao global do app nao reescreve `permissionKeys` apos salvar o proprio grant; apenas o workspace e as telas especificas refletem o calculo local.
- Ainda nao existe teste dedicado de acessibilidade com `Accessibility Guideline API`.
