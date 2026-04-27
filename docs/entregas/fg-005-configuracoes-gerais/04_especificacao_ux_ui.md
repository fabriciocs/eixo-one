# Especificacao UX/UI

## Tela

- Rota: `/settings`
- Layout: lista + detalhe responsivos
- Componentes:
  - metricas de resumo
  - filtro por busca
  - filtro por escopo
  - catalogo clicavel
  - editor do valor atual
  - card com valor padrao
  - acoes `Salvar configuracao` e `Restaurar padrao`

## Estados

- loading inicial
- empty state sem permissao
- empty state sem resultado
- erro com retry
- modo leitura sem botoes de alteracao

## Decisoes

- `boolean` usa dropdown dedicado.
- `json` usa editor textual com parse no cliente.
- O formulario trabalha sempre sobre uma configuracao selecionada.
