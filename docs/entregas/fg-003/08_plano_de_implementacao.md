# FG-003 - Plano de Implementacao

## Execucao realizada
1. Inspecao do repositorio, branch e status atual.
2. Leitura da planilha e consolidacao do escopo MVP.
3. Modelagem de contratos compartilhados para roles, catalogo e auditoria.
4. Implementacao backend de roles, auditoria e middleware de autorizacao enriquecido por grant.
5. Validacao de grants com `roleKeys` e protecao contra autoelevacao.
6. Implementacao Flutter das telas de papeis e auditoria.
7. Enriquecimento do fluxo de grants com atribuicao de roles e overrides.
8. Alinhamento de seeds Firebase/emulator com roles raiz e `audit_logs`.
9. Execucao de lint, typecheck, testes Node e validacoes Flutter.

## Ordem priorizada de entrega
- P0: backend como fonte de verdade da autorizacao.
- P0: role CRUD + auditoria.
- P1: UI administrativa para roles.
- P1: atribuicao de roles no grant.
- P1: seeds e fluxo local coerente.
- P2: sincronizacao global de sessao e features complementares.

## Backlog recomendado
- V2.1: soft delete de role e tela de historico detalhado por entidade.
- V2.2: catalogo de centros de custo e filtros dedicados.
- V2.3: sincronizacao de custom claims apos alteracao de grant.
- V2.4: testes de acessibilidade automatizados no Flutter.
- V2.5: endpoint de feature flags e politicas versionadas.
