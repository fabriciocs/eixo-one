# FG-005 - Controle da entrega

- ID: `FG-005`
- Nome: `Configuracoes gerais`
- Slug: `fg-005-configuracoes-gerais`
- Origem: planilha `docs/functional-specs/funcionalidades_sistemas_gestao_requisitos_com_prompts_codex_fullstack.xlsx`
- Data da execucao: `2026-04-27`
- Branch desejada: `feature/fg-005-configuracoes-gerais`
- Branch efetiva: `feature/fg-003-perfis-permissoes`

## Escopo entregue

- Contratos compartilhados para listagem, atualizacao e reset de configuracoes versionadas.
- Endpoints backend `GET /v1/governance/settings`, `PUT /v1/governance/settings/:settingKey` e `POST /v1/governance/settings/:settingKey/reset`.
- Persistencia em memoria e Firestore para configuracoes administrativas.
- Tela Flutter de configuracoes com filtros, detalhe, edicao de valor e restauracao ao padrao.
- Testes de contratos e integracao backend para o fluxo principal.

## Limitacoes reais

- Nao foi possivel criar branch local por permissao em `.git/refs/heads`.
- Os runners de teste baseados em `spawn` falharam no sandbox com `EPERM`.
- `dart analyze` e `flutter test` excederam o timeout do ambiente.
