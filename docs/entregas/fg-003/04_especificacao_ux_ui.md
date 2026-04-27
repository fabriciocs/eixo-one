# FG-003 - Especificacao UX/UI

## Telas afetadas
- `/roles`
- `/audit`
- `/governance/grants` (enriquecida com atribuicao de roles e overrides)

## Roles Page
- Cabecalho com resumo do modulo e acoes `Atualizar` e `Novo perfil`.
- Cards de metricas para perfis ativos, rascunhos, permissoes conhecidas e permissoes efetivas da sessao.
- `TabBar` com:
  - `Perfis`: lista filtravel + editor inline.
  - `Catalogo`: permissoes agrupadas por modulo.
- Lista com busca por nome/chave e filtro de status.
- Editor com:
  - campos principais;
  - escopo por empresa e filial;
  - centros de custo em entrada delimitada;
  - permissoes por modulo com selecao multipla.

## Audit Page
- Resumo com total de eventos, entidades unicas e ultimo evento.
- Filtro por `entityType` e `entityId`.
- Cards de evento mostrando acao, entidade, severidade, actor, correlacao e snapshots `before/after`.

## Grants Page
- Manteve contexto operacional e selecao de usuario.
- Ganhou:
  - selecao de roles ativas por `FilterChip`;
  - edicao de `permissionOverrides`;
  - preview das permissoes efetivas previstas.

## Estados de UX cobertos
- `loading`
- `empty`
- `error` com retry
- `forbidden` com mensagem explicita
- sucesso com `SnackBar`

## Decisoes de acessibilidade
- Componentes baseados em Material 3 do Flutter.
- Campos com `label`, `helperText` e `errorText` quando aplicavel.
- Alvos acionaveis amplos e legiveis em layout desktop/mobile.
- Estrutura sem modais para o fluxo principal; a edicao ocorre inline na pagina.

## Limitacoes de UX registradas
- Ainda nao existe pagina dedicada de detalhe historico por role.
- O menu lateral permanece visivel mesmo para usuarios sem leitura do modulo; o bloqueio esta no conteudo da tela.
