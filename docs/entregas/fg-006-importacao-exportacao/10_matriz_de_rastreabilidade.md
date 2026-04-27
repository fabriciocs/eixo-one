# FG-006 - Matriz de rastreabilidade

| Requisito | Implementacao |
| --- | --- |
| Importar CSV/XLSX | `POST /v1/governance/imports` com conteudo tabular normalizado |
| Mapear colunas | `mapping` no contrato `DataJob` |
| Validar registros | pre-validacao no `BaseGovernanceService` |
| Mostrar erros | `errors` e detalhe da tela Flutter |
| Permitir previa | `previewRows` |
| Exportar filtros | `POST /v1/governance/exports` |
| Processar em lote | `POST /v1/governance/imports/:jobId/run` |
