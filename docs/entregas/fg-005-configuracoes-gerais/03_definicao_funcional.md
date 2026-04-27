# Definicao funcional

## Fluxo principal

1. Usuario autorizado consulta o catalogo de configuracoes.
2. Filtra por texto e escopo.
3. Seleciona uma configuracao.
4. Edita o valor conforme o `valueType`.
5. Salva a alteracao com `expectedVersion`.
6. O backend valida escopo, tipo e concorrencia.
7. A configuracao e persistida e a auditoria e registrada.

## Fluxo alternativo

- Usuario restaura a configuracao para `defaultValue`.
- Usuario sem permissao recebe `403`.
- Versao divergente retorna `VERSION_CONFLICT`.
- Valor incompatível com o tipo retorna `VALIDATION_ERROR`.

## Regras chave

- Escopos suportados: `TENANT`, `COMPANY`, `ESTABLISHMENT`.
- Cada configuracao pertence a um `settingKey` conhecido.
- Cada update incrementa `version`.
- O reset tambem incrementa `version`.
