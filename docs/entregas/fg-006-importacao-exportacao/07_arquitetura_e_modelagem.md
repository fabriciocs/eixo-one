# FG-006 - Arquitetura e modelagem

## Entidade principal

- `DataJob`
  - identifica tenant, tipo, entidade, formato, status e arquivo.
  - guarda mapping, filtros, contadores, erros e preview.
  - registra timestamps de criacao, atualizacao e conclusao.

## Relacoes

- `DataJob` referencia indiretamente `roles`, `settings` e `audit` conforme a entidade processada.
- Auditoria registra eventos `data_job.created`, `data_job.completed` e `data_job.exported`.
