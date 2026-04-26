# Secrets

## Secrets previstos

| Secret | Uso | Observacao |
| --- | --- | --- |
| `EIXOONE_FIREBASE_PROJECT_ID` | Backend e funcoes | Nao precisa de valor versionado no repo |
| `EIXOONE_API_ENV` | Backend e funcoes | Valor de runtime, ex.: `development`, `staging`, `production` |
| `EIXOONE_JWT_AUDIENCE` | Backend | Validacao de audience quando aplicavel |
| `EIXOONE_WEBHOOK_SECRET` | Backend e funcoes | Segredo de webhooks externos |
| `EIXOONE_APP_CONFIG` | Backend e funcoes | JSON pequeno ou string de configuracao |

## Criacao sem valor

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\04-configure-secrets.ps1 -Apply
```

## Seed idempotente com valores conhecidos

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\07-seed-secret-values.ps1 -Apply
```

Esse script popula:

- `EIXOONE_FIREBASE_PROJECT_ID` com o `projectId`;
- `EIXOONE_API_ENV` com o ambiente de runtime do Node.js;
- `EIXOONE_JWT_AUDIENCE` com o `projectId`;
- `EIXOONE_APP_CONFIG` com JSON compacto de ambiente;
- `EIXOONE_WEBHOOK_SECRET` com valor gerado de forma segura quando ainda nao existe versao.

## Atualizacao segura de valor

```powershell
$value = Read-Host "Novo valor" -AsSecureString
$plain = [System.Net.NetworkCredential]::new("", $value).Password
$plain | gcloud secrets versions add EIXOONE_WEBHOOK_SECRET --data-file=-
```

Nao imprima valores no terminal, nao comite valores em `.env` versionado e nao replique service accounts no app Flutter.

## Como validar

```powershell
gcloud secrets list --project eixoone-dev --format="value(name)"
```
