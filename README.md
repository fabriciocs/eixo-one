# EixoOne

Gestao conectada. Decisoes claras.

Monorepo base do EixoOne para uma plataforma de gestao multi-tenant, multiempresa e multifilial, com:

- frontend Flutter mobile-first;
- backend HTTP em Node.js + TypeScript + Fastify;
- Firebase Auth, Firestore, Storage, Hosting e emuladores;
- contratos compartilhados versionados com Zod;
- automacao de validacao local, CI e preparacao de infraestrutura GCloud.

Este `README` foi atualizado a partir do estado real do repositorio. Sempre que houver divergencia entre documentacao antiga e o codigo, considere este arquivo e os fontes como referencia principal.

## Visao geral

O sistema esta estruturado para separar claramente:

- interface e experiencia de uso no Flutter;
- autenticacao, dados e arquivos no Firebase;
- regras sensiveis, auditoria, idempotencia e autorizacao fina na API Fastify;
- contratos de entrada/saida e tipos de dominio em `packages/shared_contracts`.

O primeiro dominio realmente implementado de ponta a ponta e `governance`, cobrindo:

- empresas;
- estabelecimentos (matriz e filial);
- grants de escopo por usuario;
- contexto operacional;
- sharing policies;
- consolidacao;
- visao consolidada;
- auditoria e idempotencia no backend.

Tambem existe um modulo `users` no backend para leitura de perfil e troca de status do usuario.

## Estado atual do sistema

### Ja implementado

- API Fastify com `helmet`, `cors`, `rate-limit`, `swagger` e `swagger-ui`.
- Middlewares de autenticacao, autorizacao, validacao, correlacao e tratamento padronizado de erros.
- Contratos compartilhados `v1` com schemas Zod para envelopes, erros, auditoria, usuarios e governanca.
- Persistencia dupla no backend:
  - `DATA_MODE=memory` para execucao rapida e testes;
  - `DATA_MODE=firebase` para Firestore/Auth reais ou emuladores.
- App Flutter com:
  - login;
  - recuperacao de senha;
  - selecao de organizacao;
  - dashboard;
  - shell responsivo;
  - telas de governanca.
- Integracao opcional do Flutter com a API de governanca via `USE_GOVERNANCE_API=true`.
- Regras Firebase para Firestore e Storage.
- Seeds e smoke tests de emuladores.
- CI no GitHub Actions.
- Base de deploy/infra para Cloud Run, Artifact Registry, Secret Manager e Cloud Build.

### Documentado para evolucao, mas nao completamente implementado no codigo

- novos dominios de negocio alem de `users` e `governance`;
- Cloud Functions reais orientadas a eventos;
- fluxos completos de staging e production alem da base de dev;
- algumas rotas descritas em specs mais antigas, mas ainda nao expostas no `register-routes.ts`;
- colecoes futuras como `operational_units`.

## Arquitetura resumida

```text
Flutter app (mobile/web)
  -> Firebase Auth
  -> Firestore / Storage
  -> Fastify API (para operacoes sensiveis e governanca)

Fastify API
  -> Firebase Admin SDK
  -> Firestore
  -> Audit logs
  -> Idempotency store

Shared contracts
  -> Zod schemas
  -> tipos de request/response
  -> erros padronizados
  -> metadados versionados
```

### Regras de uso por canal

- Flutter pode falar direto com Firebase para autenticacao, leitura controlada por rules e uploads permitidos.
- Flutter deve falar com a API para mudancas de estado, grants, consolidacao, escrita auditavel e operacoes com idempotencia.
- Cloud Run e o alvo principal da API HTTP.
- Firebase Hosting publica o build web do Flutter.

## Definicoes centrais do dominio

| Conceito | Definicao usada no sistema |
| --- | --- |
| `Tenant` | cliente do EixoOne e fronteira maxima de isolamento |
| `GrupoEconomico` | agrupador opcional de varias empresas do mesmo tenant |
| `Empresa` | entidade legal/contabil principal |
| `Matriz` | estabelecimento principal da empresa |
| `Filial` | estabelecimento adicional da mesma empresa |
| `Estabelecimento` | unidade persistida em `governance`, podendo ser `MATRIX` ou `BRANCH` |
| `UserScopeGrant` | grant persistido que define empresas, estabelecimentos, defaults, roles e permission overrides do usuario |
| `UserContext` | contexto operacional atual do usuario, com escopo ativo de escrita e escopos de leitura selecionados |
| `SharingPolicy` | politica explicita de compartilhamento entre empresas |
| `ConsolidationRun` | execucao formal de consolidacao multiempresa |
| `AuditEvent` | evento estruturado de auditoria emitido pelo backend |
| `IdempotencyRecord` | registro persistido para replay seguro de mutacoes criticas |

### Regras estruturais mais importantes

- Uma empresa deve ter exatamente uma matriz principal ativa.
- Matriz e filial sao tipos explicitos de estabelecimento.
- O sistema nao deve inferir matriz/filial apenas pelo registro fiscal.
- Escrita exige contexto operacional valido.
- Leitura consolidada pode usar varios escopos autorizados.
- Toda acao critica deve gerar auditoria estruturada.

## Modos de execucao

| Modo | Backend | Flutter | Uso principal |
| --- | --- | --- | --- |
| `memory` | repositorios em memoria | pode usar repositorios em memoria | bootstrap rapido, demos locais, testes unitarios |
| `firebase` + emuladores | Auth/Firestore/Storage locais | Firebase local + API local | desenvolvimento integrado offline do cloud real |
| `firebase` + cloud | Firebase real e Cloud Run | app apontando para Firebase/API reais | validacao de ambiente dev/staging/prod |

## Estrutura do repositorio

### Arvore de alto nivel

```text
eixo-one/
|-- .agents/
|-- .github/
|-- apps/
|-- backend/
|-- docs/
|-- firebase/
|-- packages/
|-- scripts/
|-- .dockerignore
|-- .env.example
|-- .firebaserc
|-- .firebaserc.example
|-- .gcloudignore
|-- .gitignore
|-- .nvmrc
|-- cloudbuild.yaml
|-- firebase.json
|-- package.json
|-- package-lock.json
`-- README.md
```

### Definicao das pastas e arquivos raiz

| Caminho | Papel no sistema |
| --- | --- |
| `.agents/` | playbooks auxiliares para agentes Codex; hoje contem um guia de DevOps GCloud/Firebase e um executor senior multidisciplinar para entregas ponta a ponta |
| `.github/workflows/ci.yml` | pipeline CI com validacao Node e Flutter |
| `apps/` | apps cliente; hoje contem o app Flutter principal |
| `backend/` | servicos backend; hoje contem a API Fastify |
| `docs/` | documentacao tecnica, funcional, operacional, setup, seguranca, UX e prompts |
| `firebase/` | rules, indexes, assets de emulador e seed files |
| `packages/` | pacotes compartilhados; hoje o pacote de contratos versionados |
| `scripts/` | scripts Node e PowerShell para validacao, emuladores, GCloud e deploy |
| `.env.example` | variaveis locais da API |
| `.firebaserc.example` | mapeamento de projetos Firebase por ambiente |
| `.nvmrc` | runtime Node recomendado: `22.14.0` |
| `cloudbuild.yaml` | pipeline base do Cloud Build focada em validacao do backend |
| `firebase.json` | configuracao de Firestore, Storage, Hosting e emuladores |
| `package.json` | scripts raiz do monorepo e workspaces Node (`backend/api_node` e `packages/shared_contracts`) |

### Pastas geradas ou derivadas presentes no workspace

Estas pastas existem no estado atual do repositorio, mas nao sao a fonte principal da verdade arquitetural:

- `node_modules/`
- `backend/api_node/dist/`
- `packages/shared_contracts/dist/`
- `apps/mobile_flutter/build/`
- `apps/mobile_flutter/.dart_tool/`

## Estrutura detalhada do app Flutter

```text
apps/mobile_flutter/
|-- android/                      # projeto Android
|-- ios/                          # projeto iOS
|-- lib/
|   |-- app/
|   |   |-- app.dart             # MaterialApp principal
|   |   `-- router/              # GoRouter e rotas
|   |-- core/
|   |   |-- config/              # flags e URLs por ambiente
|   |   |-- errors/              # AppFailure
|   |   |-- firebase/            # bootstrap Firebase e emuladores
|   |   |-- layout/              # shell responsivo e layout base
|   |   |-- network/             # status de conectividade
|   |   `-- theme/               # temas Material 3
|   |-- design_system/
|   |   |-- components/          # componentes reutilizaveis
|   |   `-- tokens/              # cores, radius, spacing, breakpoints
|   |-- features/
|   |   |-- app_shell/           # paginas institucionais do shell
|   |   |-- auth/                # login, reset, sessao
|   |   |-- dashboard/           # dashboard principal
|   |   |-- governance/          # empresas, grants, consolidacao e contexto
|   |   `-- splash/              # tela inicial e bootstrap
|   |-- shared/
|   |   |-- models/              # modelos usados no app
|   |   `-- utils/               # utilitarios como debouncer
|   |-- firebase_options.dart    # gerado pelo FlutterFire
|   `-- main.dart                # entrypoint
|-- test/                        # widget tests
|-- web/                         # manifest, index e icones web
|-- analysis_options.yaml
|-- firebase.json
|-- pubspec.yaml
`-- README.md
```

### Definicao de cada bloco do Flutter

| Caminho | Definicao |
| --- | --- |
| `lib/app/` | composicao do app, roteamento e bootstrap visual |
| `lib/core/config/app_config.dart` | `dart-define`s para URL da API, uso de emuladores e toggles de repositorio |
| `lib/core/firebase/firebase_bootstrap.dart` | inicializa Firebase, conecta emuladores e registra Crashlytics |
| `lib/core/layout/app_shell.dart` | shell responsivo com `NavigationRail` no desktop e `Drawer` no mobile |
| `lib/design_system/` | tokens e componentes padrao do app |
| `lib/features/auth/` | providers, repositorios e paginas de autenticacao |
| `lib/features/dashboard/` | dashboard com repositorio em memoria no estado atual |
| `lib/features/governance/` | feature mais completa do app; fala com API ou com repositorio em memoria |
| `lib/features/app_shell/` | paginas placeholder ou estruturais de modulos adjacentes |
| `test/features/governance/` | testes de paginas e comportamentos da feature de governanca |

### Comportamento atual do app Flutter

- Usa `flutter_riverpod` para estado.
- Usa `go_router` para navegacao.
- Tema baseado em Material 3 com `GoogleFonts.inter`.
- Suporta `pt-BR` e `en`.
- Usa Firebase Auth/Firestore/Storage quando `USE_FIREBASE_REPOSITORIES=true` e o bootstrap do Firebase foi bem sucedido.
- Usa repositorios em memoria como fallback ou em cenarios de demo.
- A feature `governance` pode falar com a API quando:
  - `USE_GOVERNANCE_API=true`;
  - Firebase esta inicializado;
  - existe usuario autenticado no Firebase Auth.

### Rotas do app Flutter

Rotas principais atualmente registradas:

- `/splash`
- `/login`
- `/forgot-password`
- `/select-organization`
- `/dashboard`
- `/governance`
- `/governance/companies`
- `/governance/companies/new`
- `/governance/companies/:companyId`
- `/governance/companies/:companyId/edit`
- `/governance/grants`
- `/governance/consolidation`
- `/governance/establishments/new`
- `/governance/establishments/:establishmentId/edit`
- `/modules`
- `/settings`
- `/profile`
- `/users`
- `/roles`
- `/audit`
- `/notifications`

## Estrutura detalhada do backend

```text
backend/api_node/
|-- src/
|   |-- config/                  # leitura e parse de ambiente
|   |-- core/
|   |   |-- audit/              # writer de auditoria
|   |   |-- contracts/          # sendSuccess e envelope HTTP
|   |   |-- errors/             # AppError e mapeadores
|   |   |-- logging/            # configuracao Pino/Fastify
|   |   `-- resilience/         # retry, timeout, idempotencia
|   |-- integrations/
|   |   `-- firebase/           # Admin SDK e sanitizacao Firestore
|   |-- middlewares/            # auth, authorization, validation, context, errors
|   |-- modules/
|   |   |-- governance/         # dominio principal implementado
|   |   `-- users/              # leitura de perfil e status do usuario
|   |-- routes/                 # composicao de rotas HTTP
|   |-- tests/                  # testes de integracao e helpers
|   |-- index.ts                # bootstrap HTTP
|   `-- server.ts               # construcao do Fastify e dependencias
|-- dist/                       # build TypeScript gerado
|-- Dockerfile                  # imagem para Cloud Run
|-- package.json
|-- tsconfig.json
`-- vitest.config.ts
```

### Definicao das camadas do backend

| Caminho | Definicao |
| --- | --- |
| `src/config/` | parse de `process.env` com Zod |
| `src/core/audit/` | contrato de auditoria e writer em memoria/Firestore |
| `src/core/contracts/` | envelopes de sucesso e metadados de resposta |
| `src/core/errors/` | classe `AppError` e mapeamento de `ZodError` |
| `src/core/logging/` | logger estruturado com Pino e pretty logs em desenvolvimento |
| `src/core/resilience/` | retry, timeout e stores de idempotencia |
| `src/integrations/firebase/` | criacao do app Admin e sanitizacao para Firestore |
| `src/middlewares/` | autenticacao, autorizacao, correlacao, validacao e error handler |
| `src/modules/users/` | regra de negocio para perfil e transicao de status |
| `src/modules/governance/` | regra de negocio multiempresa/multifilial |
| `src/routes/register-routes.ts` | declaracao completa das rotas publicas da API |
| `src/tests/` | testes de integracao da API e utilitarios de teste |

### Modulos de dominio do backend

#### `users`

- `domain/`
  - `user.ts`
  - `user-status-machine.ts`
- `application/`
  - `user-repository.ts`
  - `user-service.ts`
- `infrastructure/`
  - `in-memory-user.repository.ts`
  - `firestore-user.repository.ts`
- `interfaces/http/`
  - `user.controller.ts`
- `tests/`
  - `user-status-machine.test.ts`

Responsabilidades:

- retornar o perfil autenticado em `/v1/me`;
- listar usuarios do tenant;
- trocar status com validacao de maquina de estados;
- aplicar idempotencia e auditoria em mudanca de status.

#### `governance`

- `domain/`
  - `governance-state-machine.ts`
- `application/`
  - `governance-repository.ts`
  - `governance-service.ts`
- `infrastructure/`
  - `in-memory-governance.repository.ts`
  - `firestore-governance.repository.ts`
- `interfaces/http/`
  - `governance.controller.ts`
- `tests/`
  - `governance-state-machine.test.ts`
  - `governance.integration.test.ts`

Responsabilidades:

- CRUD logico de empresas e estabelecimentos;
- transicoes de estado;
- grants e contexto operacional;
- sharing policies;
- consolidacao e overview consolidado;
- filtro de acesso por tenant e grant;
- auditoria e idempotencia em mutacoes criticas.

## Estrutura detalhada dos contratos compartilhados

```text
packages/shared_contracts/
|-- src/
|   |-- index.ts
|   `-- v1/
|       |-- api-response.ts
|       |-- audit.ts
|       |-- errors.ts
|       |-- metadata.ts
|       |-- users.ts
|       `-- governance/
|           |-- common.ts
|           |-- companies.ts
|           |-- establishments.ts
|           |-- grants.ts
|           |-- contexts.ts
|           |-- sharing-policies.ts
|           `-- consolidation-runs.ts
|-- test/
|   `-- contracts.test.ts
|-- dist/
|-- package.json
`-- tsconfig.json
```

### O que existe em `shared_contracts`

| Arquivo | Definicao |
| --- | --- |
| `metadata.ts` | `tenantId`, `userId`, `correlationId`, `requestId`, `version`, `idempotencyKey`, paginacao e `contractVersion` |
| `api-response.ts` | envelope padrao de sucesso/erro |
| `errors.ts` | catalogo de codigos de erro padronizados |
| `audit.ts` | schema de evento de auditoria |
| `users.ts` | schemas e tipos do modulo de usuarios |
| `governance/common.ts` | enums, ids, permissoes e tipos base da governanca |
| `governance/companies.ts` | requests/responses e schema de empresa |
| `governance/establishments.ts` | requests/responses e schema de estabelecimento |
| `governance/grants.ts` | grants de escopo e body de upsert |
| `governance/contexts.ts` | contexto operacional e accessible scopes |
| `governance/sharing-policies.ts` | politicas de compartilhamento |
| `governance/consolidation-runs.ts` | runs, issues, overview consolidado |

### Principais permissoes definidas em contrato

- `governance.company.*`
- `governance.establishment.*`
- `governance.user_scope.manage`
- `governance.context.switch`
- `governance.sharing.policy.manage`
- `governance.consolidation.read`
- `governance.consolidation.run`
- `governance.consolidation.reprocess`
- `reporting.consolidated.read`
- `audit.read`

## Estrutura detalhada do Firebase

```text
firebase/
|-- emulators/
|   |-- README.md
|   `-- seed-files/
|       `-- tenant_demo_bootstrap.csv
|-- rules/
|   |-- firestore.rules
|   `-- storage.rules
`-- firestore.indexes.json
```

### Definicao

| Caminho | Definicao |
| --- | --- |
| `firebase/rules/firestore.rules` | rules fechadas por default; cliente nao escreve diretamente em colecoes sensiveis |
| `firebase/rules/storage.rules` | uploads permitidos por tenant, tipo MIME, tamanho e metadata |
| `firebase/firestore.indexes.json` | indices compostos para `users`, `audit_logs`, `notifications`, `companies`, `establishments`, `sharing_policies` e `consolidation_runs` |
| `firebase/emulators/README.md` | notas operacionais dos emuladores |
| `firebase/emulators/seed-files/tenant_demo_bootstrap.csv` | arquivo CSV usado no seed do Storage Emulator |

### Portas de emuladores

Definidas em `firebase.json`:

- Auth: `9099`
- Firestore: `8088`
- Storage: `9199`
- Functions: `5001`
- Hosting: `5000`
- Emulator UI: `4001`

### Hosting

O `firebase.json` publica:

- `public: apps/mobile_flutter/build/web`
- rewrite SPA para `/index.html`

## Estrutura detalhada de scripts

```text
scripts/
|-- assert-safe-deploy.mjs
|-- validate-firebase-config.mjs
|-- firebase/
|   |-- emulator-shared.mjs
|   |-- seed-emulators.mjs
|   |-- test-emulator-rules.mjs
|   `-- test-local-flow.mjs
`-- gcloud/
    |-- 00-config.ps1
    |-- 01-validate-environment.ps1
    |-- 02-enable-apis.ps1
    |-- 03-create-service-accounts.ps1
    |-- 04-configure-secrets.ps1
    |-- 05-configure-artifact-registry.ps1
    |-- 06-validate-gcloud-foundation.ps1
    |-- 07-seed-secret-values.ps1
    |-- 08-deploy-cloud-run-api.ps1
    |-- 09-smoke-test-cloud-run-api.ps1
    `-- 10-validate-flutter-firebase.ps1
```

### Scripts Node/Firebase

| Script | Finalidade |
| --- | --- |
| `scripts/validate-firebase-config.mjs` | validacao estatica de `firebase.json`, rules e indexes |
| `scripts/assert-safe-deploy.mjs` | bloqueia deploy sem ambiente explicito e exige `ALLOW_PROD_DEPLOY=true` em producao |
| `scripts/firebase/emulator-shared.mjs` | dados seed, utilitarios de emulador e helpers comuns |
| `scripts/firebase/seed-emulators.mjs` | semeia Auth, Firestore e Storage locais |
| `scripts/firebase/test-emulator-rules.mjs` | smoke tests de Firestore/Storage Rules |
| `scripts/firebase/test-local-flow.mjs` | fluxo ponta a ponta contra API local + emuladores |

### Scripts PowerShell de GCloud

| Script | Finalidade |
| --- | --- |
| `00-config.ps1` | fonte central de configuracao, nomes de service accounts, secrets e repositorio Artifact Registry |
| `01-validate-environment.ps1` | valida ferramentas e contexto local GCloud/Firebase |
| `02-enable-apis.ps1` | habilita APIs GCloud/Firebase necessarias |
| `03-create-service-accounts.ps1` | cria service accounts com papeis minimos |
| `04-configure-secrets.ps1` | cria secrets no Secret Manager |
| `05-configure-artifact-registry.ps1` | cria e valida repositorio Docker da API |
| `06-validate-gcloud-foundation.ps1` | resumo do foundation atual: projeto, servicos, service accounts, secrets e repositorios |
| `07-seed-secret-values.ps1` | popula valores iniciais seguros para os secrets previstos |
| `08-deploy-cloud-run-api.ps1` | planeja ou executa deploy guardado da API para Cloud Run |
| `09-smoke-test-cloud-run-api.ps1` | smoke test do servico Cloud Run apos deploy |
| `10-validate-flutter-firebase.ps1` | valida alinhamento entre FlutterFire, arquivos nativos e projeto Firebase |

## Estrutura detalhada da documentacao

```text
docs/
|-- architecture/
|   |-- adrs/
|   |   `-- 0001-monorepo-boundaries.md
|   |-- cloud-architecture.md
|   |-- data-model.md
|   |-- domain-module-template.md
|   |-- eixoone-foundation.md
|   |-- security-and-permissions.md
|   `-- shared-contracts.md
|-- deploy/
|   `-- cloud-build.md
|-- functional-specs/
|   |-- FG-001-backend-tech-spec.md
|   |-- FG-001-backlog.md
|   |-- FG-001-execution-plan.md
|   |-- FG-001-multiempresa-multifilial.md
|   `-- FG-001-ux-ui-spec.md
|-- operations/
|   |-- cost-control.md
|   |-- observability.md
|   `-- recoverability.md
|-- prompts/
|   |-- analista-01.md
|   |-- analista-02.md
|   |-- analista-03.md
|   |-- analista-04.md
|   `-- analista-05.md
|-- security/
|   |-- iam-matrix.md
|   `-- secrets.md
|-- setup/
|   |-- environments.md
|   |-- gcloud-setup.md
|   `-- local-setup.md
`-- ux-ui/
    `-- design-system.md
```

### Definicao das pastas de `docs`

| Pasta | Conteudo |
| --- | --- |
| `architecture/` | arquitetura base, limites do monorepo, seguranca e modelo de dados |
| `deploy/` | pipeline e fluxo manual de deploy |
| `functional-specs/` | especificacoes da feature FG-001 multiempresa/multifilial |
| `operations/` | custo, observabilidade e recuperabilidade |
| `prompts/` | prompts/roteiros de analistas para discovery, especificacao e implementacao |
| `security/` | matriz IAM e estrategia de secrets |
| `setup/` | setup local, ambientes e GCloud |
| `ux-ui/` | direcao visual e design system |

## API atualmente exposta

Quando a API sobe localmente, o Swagger UI fica disponivel em:

- `http://localhost:4000/docs`

### Infra e observabilidade

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/health` | liveness da API |
| `GET` | `/ready` | readiness dos adaptadores e dependencias |

### Usuarios

| Metodo | Rota | Permissao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/v1/me` | autenticado | perfil do usuario autenticado |
| `GET` | `/v1/users` | `users.read` | lista usuarios do tenant |
| `POST` | `/v1/users/:userId/status` | `users.manage` | troca status do usuario com idempotencia |

### Governanca: empresas

| Metodo | Rota | Permissao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/v1/governance/companies` | `governance.company.read` | lista empresas |
| `GET` | `/v1/governance/companies/:companyId` | `governance.company.read` | detalha empresa |
| `POST` | `/v1/governance/companies` | `governance.company.create` | cria empresa |
| `PATCH` | `/v1/governance/companies/:companyId` | `governance.company.update` | atualiza empresa |
| `POST` | `/v1/governance/companies/:companyId/activate` | `governance.company.activate` | ativa empresa |
| `POST` | `/v1/governance/companies/:companyId/inactivate` | `governance.company.inactivate` | inativa empresa |
| `POST` | `/v1/governance/companies/:companyId/archive` | `governance.company.archive` | arquiva empresa |

### Governanca: estabelecimentos

| Metodo | Rota | Permissao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/v1/governance/establishments` | `governance.establishment.read` | lista estabelecimentos |
| `GET` | `/v1/governance/establishments/:establishmentId` | `governance.establishment.read` | detalha estabelecimento |
| `POST` | `/v1/governance/establishments` | `governance.establishment.create` | cria estabelecimento |
| `PATCH` | `/v1/governance/establishments/:establishmentId` | `governance.establishment.update` | atualiza estabelecimento |
| `POST` | `/v1/governance/establishments/:establishmentId/activate` | `governance.establishment.activate` | ativa estabelecimento |
| `POST` | `/v1/governance/establishments/:establishmentId/inactivate` | `governance.establishment.inactivate` | inativa estabelecimento |
| `POST` | `/v1/governance/establishments/:establishmentId/archive` | `governance.establishment.archive` | arquiva estabelecimento |

### Governanca: grants e contexto

| Metodo | Rota | Permissao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/v1/governance/users/:userId/scope-grants` | `governance.user_scope.manage` | retorna grant de um usuario |
| `PUT` | `/v1/governance/users/:userId/scope-grants` | `governance.user_scope.manage` | substitui grant de um usuario |
| `GET` | `/v1/governance/me/accessible-scopes` | autenticado | resumo de escopos acessiveis |
| `GET` | `/v1/governance/me/context` | autenticado | retorna contexto atual |
| `POST` | `/v1/governance/me/context/switch` | `governance.context.switch` | troca contexto operacional |

### Governanca: sharing policies

| Metodo | Rota | Permissao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/v1/governance/sharing-policies` | `governance.sharing.policy.manage` | lista politicas de compartilhamento |
| `POST` | `/v1/governance/sharing-policies` | `governance.sharing.policy.manage` | cria politica |
| `PATCH` | `/v1/governance/sharing-policies/:policyId` | `governance.sharing.policy.manage` | atualiza politica |

### Governanca: consolidacao

| Metodo | Rota | Permissao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/v1/governance/consolidated/overview` | `reporting.consolidated.read` | visao consolidada do escopo atual |
| `GET` | `/v1/governance/consolidation-runs` | `governance.consolidation.read` | lista runs de consolidacao |
| `GET` | `/v1/governance/consolidation-runs/:runId` | `governance.consolidation.read` | detalha run |
| `POST` | `/v1/governance/consolidation-runs` | `governance.consolidation.run` | cria run de consolidacao |

### Padroes da API

- envelope de sucesso:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "contractVersion": "v1",
    "correlationId": "corr-...",
    "requestId": "req-...",
    "timestamp": "2026-04-27T00:00:00.000Z"
  }
}
```

- envelope de erro:

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Permissao insuficiente.",
    "details": []
  },
  "meta": {
    "contractVersion": "v1",
    "correlationId": "corr-...",
    "requestId": "req-...",
    "timestamp": "2026-04-27T00:00:00.000Z"
  }
}
```

- mutacoes criticas usam `x-idempotency-key`;
- respostas podem retornar `meta.idempotencyReplayed=true`;
- toda resposta inclui `x-correlation-id` e `x-request-id`.

## Maquinas de estado

### Usuarios

Transicoes permitidas em `user-status-machine.ts`:

- `invited -> active`
- `invited -> archived`
- `active -> suspended`
- `active -> archived`
- `suspended -> active`
- `suspended -> archived`

### Empresas e estabelecimentos

Transicoes permitidas em `governance-state-machine.ts`:

- `draft -> active`
- `active -> inactive`
- `inactive -> active`
- `inactive -> archived`

### Consolidation runs

Transicoes permitidas em `governance-state-machine.ts`:

- `draft -> queued`
- `draft -> blocked`
- `queued -> processing`
- `queued -> blocked`
- `blocked -> queued` por reprocessamento
- `processing -> completed`
- `processing -> completed_with_divergences`
- `processing -> failed`
- `failed -> queued` por reprocessamento

## Dados, colecoes e armazenamento

### Firestore

Colecoes base do sistema:

- `organizations`
- `users`
- `roles`
- `permissions`
- `modules`
- `audit_logs`
- `settings`
- `notifications`
- `files`
- `integrations`
- `idempotency_records`

Colecoes de governanca:

```text
/tenants/{tenantId}/domains/governance/
  companies/{companyId}
  establishments/{establishmentId}
  user_scope_grants/{userId}
  user_contexts/{userId}
  sharing_policies/{policyId}
  consolidation_runs/{runId}
```

### Storage

Uploads aceitos pelo cliente ficam sob:

```text
organizations/{tenantId}/{allPaths}
```

Guardrails de Storage:

- tamanho maximo: `< 15 MB`
- tipos permitidos:
  - `image/*`
  - `application/pdf`
  - `text/csv`
- metadata obrigatoria:
  - `tenantId`
  - `uploadedBy`

Uploads de governanca sensivel em `tenants/{tenantId}/governance/**` estao bloqueados por rule.

### Indices Firestore presentes

O arquivo `firebase/firestore.indexes.json` ja define indices para:

- `users`
- `audit_logs`
- `notifications`
- `companies`
- `establishments`
- `sharing_policies`
- `consolidation_runs`

## Seguranca, auditoria e resiliencia

### Seguranca

- Flutter nunca deve carregar service account.
- Backend usa Firebase Admin SDK.
- Toda rota protegida valida `Authorization: Bearer <idToken>`.
- Claims esperadas:
  - `tenantId`
  - `roleKeys`
  - `permissionKeys`
  - `moduleKeys`
- `platform_admin` bypassa autorizacao por permissao fina.
- Firestore Rules e Storage Rules estao fechadas por default.
- `helmet`, `cors`, `rate-limit` e limite de body ja estao aplicados.

### Auditoria

Eventos de auditoria sao emitidos para:

- mudanca de status de usuario;
- criacao e atualizacao de empresa;
- transicoes de estado de empresa e estabelecimento;
- grants;
- troca de contexto;
- sharing policies;
- criacao de consolidation runs.

Persistencia de auditoria:

- `InMemoryAuditLogWriter` em `memory`;
- `FirestoreAuditLogWriter` em `firebase`, escrevendo em `audit_logs`.

### Idempotencia

Mutacoes com replay seguro usam store de idempotencia:

- `InMemoryIdempotencyStore` em `memory`;
- `FirestoreIdempotencyStore` em `firebase`, escrevendo em `idempotency_records`.

Escopo de chave usado pelo backend:

- usuarios: `tenant:user:idempotencyKey`
- empresas: `tenant:company:create:idempotencyKey`
- estabelecimentos: `tenant:establishment:create:idempotencyKey`
- consolidation runs: `tenant:consolidation:create:idempotencyKey`

### Observabilidade

- logs estruturados em JSON via Pino/Fastify;
- pretty logs apenas em `APP_ENV=development`;
- `/health` e `/ready`;
- campos de correlacao:
  - `correlationId`
  - `requestId`
  - `userId`
  - `tenantId`
  - `latencyMs`

## Configuracao de ambiente

### `.firebaserc`

O exemplo versionado define:

- `default` -> `eixoone-dev`
- `dev` -> `eixoone-dev`
- `staging` -> `eixoone-staging`
- `prod` -> `eixoone-prod`

### Variaveis da API (`.env`)

Baseadas em `.env.example`:

| Variavel | Uso |
| --- | --- |
| `APP_ENV` | `development`, `test`, `staging` ou `production` |
| `PORT` | porta HTTP da API local |
| `BODY_LIMIT_BYTES` | limite de payload do Fastify |
| `FIREBASE_PROJECT_ID` | projeto Firebase/GCloud |
| `GOOGLE_CLOUD_PROJECT` | projeto GCloud do runtime |
| `DATA_MODE` | `memory` ou `firebase` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | credencial Admin opcional em JSON inline |
| `FIREBASE_AUTH_EMULATOR_HOST` | host do Auth Emulator |
| `FIRESTORE_EMULATOR_HOST` | host do Firestore Emulator |
| `STORAGE_EMULATOR_HOST` | host do Storage Emulator |
| `CORS_ORIGIN` | lista CSV de origins permitidas |
| `RATE_LIMIT_MAX` | maximo de requests por janela |
| `RATE_LIMIT_WINDOW_MS` | janela do rate limit |
| `LOG_LEVEL` | nivel de log Pino |

### `dart-define`s do Flutter

Definidas em `lib/core/config/app_config.dart`:

| Define | Default | Uso |
| --- | --- | --- |
| `API_BASE_URL` | calculado por plataforma | URL base da API |
| `USE_GOVERNANCE_API` | `false` | ativa repositorio HTTP para governanca |
| `API_TIMEOUT_SECONDS` | `12` | timeout dos requests HTTP |
| `USE_FIREBASE_EMULATORS` | `kDebugMode` | conecta app aos emuladores |
| `USE_FIREBASE_REPOSITORIES` | `true` | usa repositorios Firebase no app |
| `FIREBASE_EMULATOR_HOST` | calculado por plataforma | host dos emuladores |
| `FIREBASE_AUTH_EMULATOR_PORT` | `9099` | porta Auth Emulator |
| `FIRESTORE_EMULATOR_PORT` | `8088` | porta Firestore Emulator |
| `STORAGE_EMULATOR_PORT` | `9199` | porta Storage Emulator |

## Como rodar localmente

### 1. Pre-requisitos

- Node.js `22.14.0`
- npm `11`
- Flutter `3.38.7`
- Firebase CLI `15+`
- Java `11+`

### 2. Instalar dependencias

```bash
npm install
cd apps/mobile_flutter
flutter pub get
cd ../..
```

### 3. Criar arquivos locais

```bash
cp .env.example .env
cp .firebaserc.example .firebaserc
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item .firebaserc.example .firebaserc
```

### 4. Modo rapido sem Firebase real

Use:

```text
DATA_MODE=memory
```

Backend:

```bash
cd backend/api_node
npm run dev
```

Flutter usando repositorios em memoria:

```bash
cd apps/mobile_flutter
flutter run -d chrome --dart-define=USE_FIREBASE_REPOSITORIES=false --dart-define=USE_GOVERNANCE_API=false
```

### 5. Modo integrado com emuladores Firebase

Configure `.env` com:

```text
APP_ENV=development
DATA_MODE=firebase
FIREBASE_PROJECT_ID=eixoone-dev
GOOGLE_CLOUD_PROJECT=eixoone-dev
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088
STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

Suba os emuladores:

```bash
npm run emulators:start
```

Semeie os dados:

```bash
npm run emulators:seed
```

Suba a API:

```bash
cd backend/api_node
npm run dev
```

Suba o Flutter web:

```bash
cd apps/mobile_flutter
flutter run -d chrome --dart-define=USE_GOVERNANCE_API=true
```

### 6. Credenciais seeded para emuladores

Criadas por `scripts/firebase/seed-emulators.mjs`:

- `admin@eixo.one` / `12345678`
- `operador@eixo.one` / `12345678`

### 7. Observacoes de host para dispositivos

- Web: `127.0.0.1`
- Android Emulator: `10.0.2.2`
- Dispositivo fisico: sobrescreva `FIREBASE_EMULATOR_HOST`

Exemplo:

```bash
flutter run -d android --dart-define=FIREBASE_EMULATOR_HOST=192.168.0.10
```

## Comandos principais

### Monorepo raiz

| Comando | Finalidade |
| --- | --- |
| `npm install` | instala dependencias Node |
| `npm run build` | builda contratos e backend |
| `npm run lint` | valida TypeScript dos workspaces Node |
| `npm run typecheck` | typecheck dos workspaces Node |
| `npm run test` | testes de contratos e backend |
| `npm run validate` | lint + typecheck + test + validacao Firebase |
| `npm run validate:firebase` | validacao estatica de config Firebase |
| `npm run emulators:start` | sobe Auth/Firestore/Storage/Hosting emuladores |
| `npm run emulators:seed` | seed local |
| `npm run test:emulators:rules` | smoke tests das rules |
| `npm run test:emulators:flow` | fluxo local integrado backend + emuladores |
| `npm run test:emulators` | rules + fluxo integrado |
| `npm run deploy:web:staging` | deploy hosting de staging com guarda |
| `npm run deploy:web:production` | deploy hosting de producao com guarda extra |

### Backend

| Comando | Finalidade |
| --- | --- |
| `npm run dev -w @eixoone/api-node` | API em watch mode |
| `npm run build -w @eixoone/api-node` | build TypeScript |
| `npm run test -w @eixoone/api-node` | testes Vitest |

### Shared contracts

| Comando | Finalidade |
| --- | --- |
| `npm run build -w @eixoone/shared-contracts` | gera `dist/` |
| `npm run test -w @eixoone/shared-contracts` | testa schemas e tipos |

### Flutter

| Comando | Finalidade |
| --- | --- |
| `flutter pub get` | instala dependencias Dart |
| `flutter analyze` | analise estatica |
| `flutter test` | widget tests |
| `flutter build web --release` | build web para Firebase Hosting |

## Testes e validacoes

### Backend e contratos

Arquivos de teste mais relevantes:

- `packages/shared_contracts/test/contracts.test.ts`
- `backend/api_node/src/tests/app.integration.test.ts`
- `backend/api_node/src/tests/retry.test.ts`
- `backend/api_node/src/modules/users/tests/user-status-machine.test.ts`
- `backend/api_node/src/modules/governance/tests/governance-state-machine.test.ts`
- `backend/api_node/src/modules/governance/tests/governance.integration.test.ts`

Cobertura atual esperada:

- contratos versionados;
- health e auth da API;
- paginacao;
- idempotencia;
- mudanca de status;
- maquina de estados;
- integracao de governanca.

### Flutter

Arquivos de teste mais relevantes:

- `apps/mobile_flutter/test/widget_test.dart`
- `apps/mobile_flutter/test/features/governance/governance_pages_test.dart`

Cobertura atual esperada:

- carregamento de paginas de governanca;
- estados de permissao;
- validacao inline de formularios;
- grants;
- comportamento read-only de consolidacao.

### Smoke tests de emuladores

```bash
npm run emulators:seed
npm run test:emulators
```

Opcao em uma unica execucao:

```bash
firebase emulators:exec --only auth,firestore,storage "npm run test:emulators"
```

### Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4000/ready
```

## CI, build e deploy

### GitHub Actions

`.github/workflows/ci.yml` faz:

1. checkout;
2. setup Node pela `.nvmrc`;
3. `npm ci`;
4. `npm run validate`;
5. setup Flutter `3.38.7`;
6. `flutter pub get`;
7. `flutter analyze`;
8. `flutter test`;
9. `flutter build web --release`.

### Cloud Build

`cloudbuild.yaml`:

- instala dependencias do backend;
- roda `lint`, `typecheck`, `test` e `build` apenas se o script existir;
- nao faz deploy por padrao;
- aceita `_DEPLOY=true`, mas o deploy continua manual por design.

### Docker da API

`backend/api_node/Dockerfile`:

- usa build multi-stage;
- compila `shared_contracts` e `api_node`;
- instala apenas dependencias de producao na imagem final;
- sobe a API em `PORT=8080`.

### Deploy web

```bash
cd apps/mobile_flutter
flutter build web --release
cd ../..
npm run deploy:web:staging
```

Produzindo deploy de producao:

```bash
ALLOW_PROD_DEPLOY=true npm run deploy:web:production
```

### Deploy da API em Cloud Run

Planejamento:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\08-deploy-cloud-run-api.ps1
```

Execucao:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\08-deploy-cloud-run-api.ps1 -Apply
```

O script:

- valida o monorepo por padrao antes do deploy;
- builda imagem Docker em Artifact Registry;
- deploya `eixoone-api-dev` em `southamerica-east1`;
- usa `min-instances=0`, `max-instances=2`, `cpu=1`, `memory=512Mi`;
- injeta config por env vars e secrets;
- exige confirmacao manual, salvo `-SkipConfirmation`.

## Infraestrutura GCloud e Firebase

### Convenio atual de ambientes

| Ambiente | Projeto |
| --- | --- |
| `dev` | `eixoone-dev` |
| `staging` | `eixoone-staging` |
| `prod` | `eixoone-prod` |

### Topologia de cloud pretendida e parcialmente preparada

- Cloud Run para API HTTP.
- Firebase Auth para autenticacao.
- Firestore Native para persistencia.
- Firebase Storage para arquivos.
- Firebase Hosting para web.
- Secret Manager para configuracao sensivel do backend.
- Artifact Registry para imagens Docker.

### Service accounts previstas

Definidas em `scripts/gcloud/00-config.ps1`:

- `eixoone-api-dev`
- `eixoone-functions-dev`
- `eixoone-ci-dev`
- `eixoone-deploy-dev`
- `eixoone-observability-dev`

### Secrets previstos

- `EIXOONE_FIREBASE_PROJECT_ID`
- `EIXOONE_API_ENV`
- `EIXOONE_JWT_AUDIENCE`
- `EIXOONE_WEBHOOK_SECRET`
- `EIXOONE_APP_CONFIG`

## Documentacao complementar

### Arquitetura e contratos

- `docs/architecture/eixoone-foundation.md`
- `docs/architecture/shared-contracts.md`
- `docs/architecture/security-and-permissions.md`
- `docs/architecture/data-model.md`
- `docs/architecture/domain-module-template.md`
- `docs/architecture/cloud-architecture.md`
- `docs/architecture/adrs/0001-monorepo-boundaries.md`

### Setup e ambientes

- `docs/setup/local-setup.md`
- `docs/setup/gcloud-setup.md`
- `docs/setup/environments.md`

### Operacao, deploy e seguranca

- `docs/deploy/cloud-build.md`
- `docs/operations/observability.md`
- `docs/operations/recoverability.md`
- `docs/operations/cost-control.md`
- `docs/security/iam-matrix.md`
- `docs/security/secrets.md`

### Produto, UX e especificacoes

- `docs/ux-ui/design-system.md`
- `docs/functional-specs/FG-001-multiempresa-multifilial.md`
- `docs/functional-specs/FG-001-ux-ui-spec.md`
- `docs/functional-specs/FG-001-backend-tech-spec.md`
- `docs/functional-specs/FG-001-backlog.md`
- `docs/functional-specs/FG-001-execution-plan.md`

### Prompts e processo assistido

- `docs/prompts/analista-01.md`
- `docs/prompts/analista-02.md`
- `docs/prompts/analista-03.md`
- `docs/prompts/analista-04.md`
- `docs/prompts/analista-05.md`

## Observacoes importantes sobre o estado do repositorio

- O `README` do app Flutter (`apps/mobile_flutter/README.md`) ainda e o stub padrao do Flutter e nao representa a arquitetura atual.
- Existem artefatos gerados (`dist`, `build`, `.dart_tool`, `node_modules`) no workspace; a manutencao funcional deve ser feita nos fontes em `src/` e `lib/`.
- Algumas specs de `docs/functional-specs/` descrevem endpoints e estruturas futuras que ainda nao estao 100% refletidos no `register-routes.ts`.
- O dashboard Flutter ainda usa repositorio em memoria por padrao; a feature `governance` ja pode usar a API.

## Proximos passos sugeridos

1. Conectar o dashboard Flutter a dados reais via Firebase/API.
2. Fechar staging e production com variaveis e deploy automatizado controlado.
3. Expandir dominios alem de `users` e `governance`.
4. Harmonizar specs antigas com o estado real das rotas implementadas.
5. Substituir o `README` interno do app Flutter por documentacao coerente com este arquivo.
