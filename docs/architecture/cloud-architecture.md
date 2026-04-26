# Cloud Architecture

## Decisao principal

- `Cloud Run` para a API HTTP Node.js.
- `Cloud Functions` apenas para eventos Firebase, Pub/Sub, Storage ou Firestore.
- `Firebase` para Auth, Firestore, Storage, App Check, Hosting web e emuladores.
- `Secret Manager` para configuracao sensivel do backend.
- `Artifact Registry` para imagens Docker da API.

## Topologia base

```text
Flutter/Web
  -> Firebase Auth / Firestore / Storage / Hosting
  -> Cloud Run API

Cloud Run API
  -> Firebase Admin SDK
  -> Firestore
  -> Secret Manager
  -> Cloud Logging / Monitoring

Cloud Functions
  -> Eventos Firebase e Pub/Sub
```

## Guardrails

- Firestore em modo `Native`.
- Storage sem acesso publico.
- App Check obrigatorio fora do ambiente local.
- Logs estruturados com `correlationId`.
- Endpoints `/health` e `/ready` mantidos no backend.

## Como reexecutar a preparacao

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\02-enable-apis.ps1 -Apply
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\03-create-service-accounts.ps1 -Apply
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\04-configure-secrets.ps1 -Apply
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\05-configure-artifact-registry.ps1 -Apply
```
