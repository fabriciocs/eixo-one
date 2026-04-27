# FG-006 - Entendimento e diagnostico

## Fatos

- A planilha define `FG-006` como importacao/exportacao com preview, validacao, processamento em lote e controle de seguranca.
- O monorepo ja tinha contratos iniciais de `data-jobs`, sem uso efetivo no backend ou no Flutter.
- `FG-003`, `FG-004` e `FG-005` ja estruturaram o modulo `base-governance` com papeis, auditoria e configuracoes.

## Premissas

- O MVP deve reaproveitar o padrao atual JSON/REST em vez de abrir upload multipart e armazenamento de arquivo agora.
- O menor fluxo ponta a ponta util e importar `roles`/`settings` e exportar `roles`/`settings`/`audit`.

## Diagnostico

- O gap principal era a ausencia do pipeline de job com validacao, preview, execucao e persistencia.
- Havia dependencia direta de permissoes e auditoria; por isso a feature entrou no mesmo modulo administrativo.
