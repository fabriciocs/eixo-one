# Environments

## Convencao recomendada

| Ambiente | Project ID | Alias Firebase | Regiao |
| --- | --- | --- | --- |
| dev | `eixoone-dev` | `dev` | `southamerica-east1` |
| staging | `eixoone-staging` | `staging` | `southamerica-east1` |
| prod | `eixoone-prod` | `prod` | `southamerica-east1` |

## Regras praticas

- `dev` usa Firebase Emulator Suite sempre que possivel.
- `staging` valida integracoes e politicas IAM antes de producao.
- `prod` exige confirmacao explicita para deploy.
- O app Flutter deve apontar para o projeto correto via `flutterfire configure` por ambiente.

## Arquivos relacionados

- `.firebaserc`
- `.firebaserc.example`
- `.env.example`
- `scripts/gcloud/00-config.ps1`

## Como validar

```powershell
firebase use dev
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\06-validate-gcloud-foundation.ps1
```
