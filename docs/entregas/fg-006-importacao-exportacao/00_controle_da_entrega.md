# FG-006 - Controle da entrega

- ID: `FG-006`
- Nome: `Importacao e exportacao`
- Slug: `fg-006-importacao-exportacao`
- Origem: planilha `docs/functional-specs/funcionalidades_sistemas_gestao_requisitos_com_prompts_codex_fullstack.xlsx`
- Data da execucao: `2026-04-27`
- Branch desejada: `feature/fg-006-importacao-exportacao`
- Branch efetiva: `feature/fg-003-perfis-permissoes`

## Escopo entregue

- Contratos compartilhados para jobs administrativos de importacao e exportacao.
- Endpoints backend `GET /v1/governance/data-jobs`, `POST /v1/governance/imports`, `POST /v1/governance/imports/:jobId/run` e `POST /v1/governance/exports`.
- Persistencia em memoria e Firestore para historico de jobs.
- Tela Flutter administrativa com historico, criacao de jobs, preview, erros e execucao.
- Testes de contratos, integracao backend e widget para o fluxo principal do MVP.

## Limitacoes reais

- O MVP usa conteudo tabular normalizado em texto/CSV no lugar de upload binario multipart real.
- A importacao executa apenas `roles` e `settings`; a exportacao cobre `roles`, `settings` e `audit`.
- O ambiente continua sujeito a falhas conhecidas de sandbox em runners baseados em `spawn` e operacoes Git.
