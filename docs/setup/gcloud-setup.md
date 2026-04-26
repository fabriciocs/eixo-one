# GCloud Setup

## Variaveis usadas

```powershell
$env:EIXOONE_PROJECT_ID = "eixoone-dev"
$env:EIXOONE_PROJECT_NAME = "EixoOne"
$env:EIXOONE_BILLING_ACCOUNT_ID = "<billing-account-id>"
$env:EIXOONE_REGION = "southamerica-east1"
$env:EIXOONE_FIRESTORE_LOCATION = "southamerica-east1"
$env:EIXOONE_ENVIRONMENT = "dev"
$env:EIXOONE_SUPPORT_EMAIL = "<email-suporte>"
$env:EIXOONE_APP_NAME = "eixoone"
$env:EIXOONE_SERVICE_PREFIX = "eixoone"
```

## Ordem de execucao

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\01-validate-environment.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\06-validate-gcloud-foundation.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\02-enable-apis.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\03-create-service-accounts.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\04-configure-secrets.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\05-configure-artifact-registry.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\07-seed-secret-values.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\08-deploy-cloud-run-api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\09-smoke-test-cloud-run-api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\10-validate-flutter-firebase.ps1
```

Os scripts acima rodam em modo planejamento por padrao. Para aplicar mudancas reais, repita o script com `-Apply`.

## Estado atual do ambiente dev

- projeto `eixoone-dev` criado;
- billing vinculado;
- projeto registrado no Firebase;
- APIs base habilitadas;
- Firestore Native `(default)` criado em `southamerica-east1`;
- bucket padrao `eixoone-dev.firebasestorage.app` criado em `southamerica-east1`;
- service accounts, Artifact Registry e secrets provisionados;
- versions reais criadas para os secrets do backend;
- apps Flutter Android, iOS e Web registrados via `flutterfire configure`;
- API dev publicada em Cloud Run.

## Como validar

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\01-validate-environment.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\06-validate-gcloud-foundation.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\10-validate-flutter-firebase.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\09-smoke-test-cloud-run-api.ps1
```

## Reexecucao segura

- Todos os scripts verificam existencia antes de criar.
- Secrets sao criados antes sem valor e podem ser populados por `07-seed-secret-values.ps1`.
- O deploy do Cloud Run exige `-Apply` e confirmacao manual com `DEPLOY`, salvo override explicito.
- Se o projeto nao existir ou nao estiver acessivel, os scripts falham cedo com mensagem curta.

## Pendencias reais

- Revisar e eventualmente rotacionar `EIXOONE_WEBHOOK_SECRET` para um valor gerado pelo time.
- Configurar provedores de Authentication e App Check no console Firebase.
- Popular dados iniciais no Firestore para testes end-to-end.
