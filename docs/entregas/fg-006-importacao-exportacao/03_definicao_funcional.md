# FG-006 - Definicao funcional

## Fluxo principal do MVP

1. Usuario autorizado cria um job de importacao com entidade, formato, nome de arquivo e conteudo tabular.
2. Backend pre-valida cabecalho e linhas, gera preview e classifica o job.
3. Usuario revisa erros ou executa o job validado.
4. Backend aplica o lote em `roles` ou `settings`, audita a execucao e atualiza o status.
5. Usuario cria exportacoes para `roles`, `settings` ou `audit` e consulta a previa gerada.

## Fluxos alternativos

- Job com erros fica bloqueado para execucao.
- Usuario sem permissao recebe bloqueio no frontend e `403` no backend.
- Entidades fora do MVP retornam erro explicito de validacao.
