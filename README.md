# EixoOne

Gestao conectada. Decisoes claras.

Base evolutiva para um monorepo `Flutter + Firebase + Node.js/TypeScript`, com foco em modularidade por dominio, seguranca, auditoria, operacao multi-tenant e qualidade verificavel.

## Estrutura do monorepo

```text
/eixoone
  /apps
    /mobile_flutter
  /backend
    /api_node
  /firebase
    /emulators
    /rules
  /docs
    /architecture
    /functional-specs
    /operations
    /setup
    /ux-ui
  /packages
    /shared_contracts
  /scripts
```

## O que esta implementado

- `packages/shared_contracts` com contratos versionados `v1`, schemas Zod, envelopes de API, codigos de erro e metadados padronizados.
- `backend/api_node` com Fastify, middlewares de autenticacao/autorizacao, correlacao, logs JSON, health/readiness, idempotencia, maquina de estados, auditoria e testes.
- `backend/api_node` com modulo `governance` multiempresa/multifilial persistido em Firestore quando `DATA_MODE=firebase`, mantendo fallback em memoria para testes unitarios e bootstraps locais.
- `apps/mobile_flutter` com design system Material 3, sessao local, formularios validados, retry, feedback inline, camada de repositorios/servicos, `firebase_options.dart` gerado e testes de widget.
- Regras Firebase para Firestore/Storage, indices iniciais, validacao estatica e separacao de ambientes.
- Base Google Cloud/Firebase de `dev` provisionada com `eixoone-dev`, billing ativo, Firestore Native, bucket padrao de Storage, service accounts, secrets populados para backend, Artifact Registry e Cloud Run.
- Workflow de CI em `.github/workflows/ci.yml`.

## Prerequisitos

- `Node.js 22.14.0` recomendado via `.nvmrc`
- `npm 11`
- `Flutter 3.38.7`
- `Firebase CLI 15+`
- `JDK 11+` para emuladores Firebase

Observacao: o ambiente atual estava em `Node 24.11.1`. O monorepo continua validando, mas o runtime-alvo permanece `Node 22 LTS` para manter paridade com Cloud Run/Functions.

## Comandos principais

### Node e Firebase

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run validate
```

### Flutter

```bash
cd apps/mobile_flutter
flutter pub get
flutter analyze
flutter test
flutter build web
```

## Como executar localmente

1. Copie `.env.example` para `.env`.
2. Copie `.firebaserc.example` para `.firebaserc`.
3. Para modo local sem Firebase real, mantenha `DATA_MODE=memory`.
4. Para modo com emuladores, ajuste `DATA_MODE=firebase` e exporte:

```bash
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088
STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

5. Suba os emuladores:

```bash
firebase emulators:start
```

Opcao recomendada para o monorepo:

```bash
npm run emulators:start
```

6. Semeie Auth, Firestore e Storage locais:

```bash
npm run emulators:seed
```

7. Suba a API:

```bash
cd backend/api_node
npm run dev
```

8. Suba o app Flutter:

```bash
cd apps/mobile_flutter
flutter run -d chrome
```

Em `debug`, o app Flutter passa a apontar para os emuladores por padrao. Para dispositivo fisico, sobrescreva o host:

```bash
flutter run -d android --dart-define=FIREBASE_EMULATOR_HOST=192.168.0.10
```

## Como testar

### Validacao completa do backend/contracts/Firebase

```bash
npm run validate
```

### Testes do Flutter

```bash
cd apps/mobile_flutter
flutter analyze
flutter test
```

### Smoke tests de emuladores

Com os emuladores ativos:

```bash
npm run emulators:seed
npm run test:emulators
```

Opcao mais direta para validacao ponta a ponta em uma unica execucao:

```bash
firebase emulators:exec --only auth,firestore,storage "npm run test:emulators"
```

### Validacao da fundacao GCloud/Firebase

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\06-validate-gcloud-foundation.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\10-validate-flutter-firebase.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\09-smoke-test-cloud-run-api.ps1
```

### Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4000/ready
```

## Como fazer o primeiro deploy

### Web Flutter

```bash
cd apps/mobile_flutter
flutter build web --release
cd ../..
npm run deploy:web:staging
```

### Producao

```bash
ALLOW_PROD_DEPLOY=true npm run deploy:web:production
```

### API dev em Cloud Run

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\08-deploy-cloud-run-api.ps1 -Apply
```

### API

- Recomendacao principal: `Cloud Run` para a API HTTP.
- Opcao complementar: `Cloud Functions` para gatilhos pequenos e webhooks orientados a eventos.
- Antes de deployar a API, troque `DATA_MODE=memory` por `DATA_MODE=firebase` e configure credenciais seguras no ambiente.

## Riscos e decisoes pendentes

- Configurar provedores de Authentication e App Check no console Firebase.
- Decidir quando o dashboard Flutter deixa de usar repositorios em memoria e passa para Firestore/API por padrao.
- Definir a malha oficial de `custom claims` por tenant, papel e modulo.
- Trocar o repositório de `governance` de Firestore para projeções e consultas mais especializadas se o volume do tenant crescer significativamente.

## Proximos passos

1. Adicionar repositores reais do Flutter com Firebase Auth/Firestore/Storage.
2. Criar primeiros dominios de negocio alem de `users`, como `crm` e `finance`.
3. Expandir os smoke tests de emuladores para cenarios de falha, concorrencia e versionamento otimista.
4. Fechar deploy automatizado da API em Cloud Run com ambientes `staging` e `production`.

## Documentacao

- [Arquitetura base](docs/architecture/eixoone-foundation.md)
- [Template para novos dominios](docs/architecture/domain-module-template.md)
- [Contratos compartilhados](docs/architecture/shared-contracts.md)
- [Modelo de dados](docs/architecture/data-model.md)
- [Seguranca e permissoes](docs/architecture/security-and-permissions.md)
- [Setup local](docs/setup/local-setup.md)
- [Observabilidade e troubleshooting](docs/operations/observability.md)
- [Recuperabilidade e falhas](docs/operations/recoverability.md)
- [Design system Flutter](docs/ux-ui/design-system.md)
