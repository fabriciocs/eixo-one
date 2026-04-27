# FG-006 - Especificacao tecnica frontend

## Camadas atualizadas

- `base_governance_models.dart` para enums e modelos de job.
- `base_governance_repository.dart` para APIs e fallback in-memory.
- `data_jobs_page.dart` para a pagina administrativa.
- `app_router.dart` para expor `/data-jobs`.

## Comportamento

- O frontend sempre consulta historico primeiro.
- A criacao de importacao usa texto CSV normalizado como payload do MVP.
- A execucao de job so aparece para jobs de importacao selecionados.
