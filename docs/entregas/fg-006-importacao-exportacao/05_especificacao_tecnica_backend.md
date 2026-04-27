# FG-006 - Especificacao tecnica backend

## Endpoints

- `GET /v1/governance/data-jobs`
- `POST /v1/governance/imports`
- `POST /v1/governance/imports/:jobId/run`
- `POST /v1/governance/exports`

## Regras principais

- `data_jobs.read` controla consulta.
- `data_jobs.manage` controla criacao e execucao.
- Importacao suportada no MVP: `roles`, `settings`.
- Exportacao suportada no MVP: `roles`, `settings`, `audit`.
- Jobs com erros nao executam.
