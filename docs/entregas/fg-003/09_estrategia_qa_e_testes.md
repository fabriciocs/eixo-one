# FG-003 - Estrategia QA e Testes

## Objetivos
- Garantir que perfis nao sejam apenas cadastro, mas impactem autorizacao real.
- Cobrir caminhos felizes, negacoes, conflitos de versao e integracao role->grant->rota protegida.

## Backend
- Unitarios:
  - validacao de permissoes desconhecidas
  - conflito de versao
  - escrita de auditoria
- Integracao:
  - criar/editar role via HTTP
  - ler auditoria de role
  - autorizar leitura de roles por grant persistido mesmo sem claim

## Frontend
- Widget tests:
  - overview/governanca
  - grants com papel/override visiveis
  - roles page com catalogo e estado de acesso negado
  - audit page com trilha seed

## Seguranca e autorizacao
- Validar `403` para sessao sem leitura de roles.
- Validar ausencia de autoelevacao no backend.
- Validar isolamento de tenant nos testes de governanca existentes.

## Acessibilidade
- Ja foram consideradas mensagens claras, labels e alvos adequados.
- Pendencia: adicionar testes com `meetsGuideline(...)` para contraste, labels e target size.

## Checklist final
- Requisitos criticos mapeados para testes: `sim`
- Casos positivos/negativos/borda: `sim`
- Testes de permissao/autorizacao: `sim`
- Testes de API/contrato: `sim`
- Testes de componente/tela: `sim`
- Acessibilidade considerada: `parcial`
- Lint, typecheck e testes executados: `sim`
