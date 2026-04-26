# Cloud Build

## O que o pipeline faz

- instala dependencias do backend apenas se `backend/api_node/package.json` existir;
- roda `lint`, `typecheck`, `test` e `build` apenas se o script existir;
- nao faz deploy por padrao;
- aceita `_DEPLOY=true`, mas mantem o deploy manual e protegido.

## Execucao padrao

```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions _DEPLOY=false
```

## Deploy da API dev

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\08-deploy-cloud-run-api.ps1 -Apply
```

O script:

- valida o monorepo antes do deploy, a menos que voce use `-SkipLocalValidation`;
- builda a imagem no Artifact Registry com `backend/api_node/Dockerfile`;
- publica o servico `eixoone-api-dev` em `southamerica-east1`;
- exige confirmacao manual digitando `DEPLOY`, salvo se voce usar `-SkipConfirmation` em um fluxo controlado;
- usa `min-instances=0` e `max-instances=2` para conter custo.

## Deploy guardado por confirmacao manual

```powershell
$ConfirmDeploy = Read-Host "Confirmar deploy? Digite DEPLOY para continuar"
if ($ConfirmDeploy -ne "DEPLOY") {
  Write-Host "Deploy cancelado com seguranca."
  exit 0
}

gcloud run deploy eixoone-api-dev `
  --project eixoone-dev `
  --region southamerica-east1 `
  --service-account eixoone-api-dev@eixoone-dev.iam.gserviceaccount.com `
  --image southamerica-east1-docker.pkg.dev/eixoone-dev/eixoone-api-dev/api:latest `
  --allow-unauthenticated
```

## Como validar

```powershell
Get-Content cloudbuild.yaml
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\09-smoke-test-cloud-run-api.ps1
```
