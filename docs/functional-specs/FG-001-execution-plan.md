# Plano de Execucao - FG-001 Multiempresa e Multifilial

## 1. Objetivo

Este documento traduz a especificacao funcional `FG-001` e o backlog funcional em um plano de execucao operacional por disciplina, com tickets propostos, dependencias, entregaveis e validacoes esperadas.

## 2. Documentos base

- [FG-001-multiempresa-multifilial.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-multiempresa-multifilial.md)
- [FG-001-backlog.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-backlog.md)
- [FG-001-ux-ui-spec.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-ux-ui-spec.md)

## 3. Estrategia de entrega

### Onda 1 - Fundacao estrutural e seguranca

- modelagem organizacional;
- grants por empresa e estabelecimento;
- contexto unico de escrita;
- auditoria estrutural;
- UX base de selecao de contexto e cadastros.

### Onda 2 - Leitura consolidada e compartilhamento governado

- escopo multiplo de leitura;
- politica de `scopeType` e `shareMode`;
- telas consolidadas iniciais;
- bloqueios cross-company;
- regressao de seguranca e UX.

### Onda 3 - Consolidacao completa e total

- parametros de consolidacao;
- mapeamento de contas e dimensoes;
- moedas, percentuais e calendarios;
- runs de consolidacao;
- reconciliacao, eliminacoes e rastreabilidade.

### Onda 4 - Intercompany e rollout corporativo

- parceiros intercompany;
- fluxos de espelhamento;
- fila de excecoes;
- operacao assistida;
- hardening, monitoracao e rollout controlado.

## 4. Tickets propostos por disciplina

## Produto

### PO-FG-001-01 - Fechar taxonomia organizacional

**Objetivo**

Fechar a nomenclatura oficial de `tenant`, `grupo economico`, `empresa`, `matriz`, `filial` e `unidade operacional`.

**Entregaveis**

- decisao oficial aprovada por produto;
- tabela de termos e definicoes;
- lista de campos obrigatorios por nivel.

**Dependencias**

- nenhuma

**Aceite**

- o time inteiro passa a usar uma unica taxonomia;
- nao restam ambiguidades entre entidade legal e estabelecimento.

### PO-FG-001-02 - Fechar escopo de consolidacao

**Objetivo**

Confirmar o que entra no conceito de consolidacao total na versao inicial.

**Entregaveis**

- escopo por dominio;
- lista de indicadores obrigatorios;
- regras de fechamento, eliminacao e reconciliacao priorizadas.

**Dependencias**

- PO-FG-001-01

**Aceite**

- consolidacao organizacional, operacional, financeira e contabil tem fronteiras claras;
- backlog tecnico consegue ser decomposto sem reinterpretacao adicional.

## UX/UI

### UX-FG-001-01 - Jornada de contexto operacional

**Objetivo**

Desenhar a experiencia de selecao, exibicao e troca de contexto de leitura e escrita.

**Entregaveis**

- fluxo de login ate selecao de contexto;
- seletor persistente de empresa/estabelecimento;
- estados de erro, bloqueio e perda de acesso;
- especificacao de acessibilidade e feedback.

**Dependencias**

- PO-FG-001-01

**Aceite**

- o usuario sempre entende onde esta lendo e onde esta gravando;
- a diferenca entre leitura multiempresa e escrita com contexto unico fica evidente.

### UX-FG-001-02 - Fluxos de cadastro estrutural

**Objetivo**

Desenhar criacao, edicao, ativacao, inativacao e arquivamento de empresa, matriz e filial.

**Entregaveis**

- wireframes e prototipos;
- estados de loading, vazio, erro e conflito;
- fluxo sem depender de modais centrais;
- confirmacoes para acoes irreversiveis.

**Dependencias**

- UX-FG-001-01

**Aceite**

- os fluxos seguem mobile-first e Material 3;
- a estrutura de navegacao e previsivel em celular, tablet e web.

### UX-FG-001-03 - Visoes consolidadas e filtros

**Objetivo**

Desenhar dashboards e listagens consolidadas com filtros multiempresa seguros.

**Entregaveis**

- dashboard consolidado inicial;
- padrao de filtros por empresa, estabelecimento, periodo e dominio;
- pagina de detalhe e drill-down.

**Dependencias**

- PO-FG-001-02
- UX-FG-001-01

**Aceite**

- o usuario entende claramente o escopo do consolidado;
- a tela evidencia quando o resultado e parcial, processando ou assinado por run.

## Arquitetura

### ARCH-FG-001-01 - Modelo canonico organizacional

**Objetivo**

Definir o modelo canonico de entidades, relacionamentos, invariantes e identificadores.

**Entregaveis**

- diagrama de dominio;
- contratos de entrada e saida;
- invariantes como matriz unica ativa e filial vinculada a uma unica empresa;
- estrategia de versionamento dos contratos.

**Dependencias**

- PO-FG-001-01

**Aceite**

- backend, frontend e contratos compartilhados usam a mesma estrutura;
- nao ha ambiguidade na modelagem de CNPJ e estabelecimento.

### ARCH-FG-001-02 - Politica de escopo e compartilhamento

**Objetivo**

Definir como `scopeType` e `shareMode` se aplicam aos dominios do EixoOne.

**Entregaveis**

- matriz por dominio;
- regras de ownership;
- casos em que `SINGLE_MASTER`, `REPLICATED` e `NONE` sao permitidos.

**Dependencias**

- ARCH-FG-001-01

**Aceite**

- cada dominio dependente sabe em qual escopo nasce e como pode ser compartilhado;
- o modelo suporta expansao sem abrir dados por acidente.

### ARCH-FG-001-03 - Arquitetura da consolidacao total

**Objetivo**

Definir a arquitetura funcional e tecnica da consolidacao completa.

**Entregaveis**

- componentes de consolidacao;
- estrategia de runs e reprocessamento;
- desenho de mapeamento de contas, moedas, percentuais e eliminacoes;
- integracao com auditoria e observabilidade.

**Dependencias**

- PO-FG-001-02
- ARCH-FG-001-01

**Aceite**

- existe um desenho implementavel para consolidacao total;
- fica claro o que e calculo online, o que e assinado por run e o que exige processamento assicrono.

## Backend

### BE-FG-001-01 - Entidades, schemas e repositorios organizacionais

**Objetivo**

Implementar contratos, validacoes e persistencia de empresa, estabelecimento e unidade operacional.

**Entregaveis**

- schemas compartilhados;
- DTOs e contratos versionados;
- repositorios com validacoes de unicidade e relacionamento;
- testes unitarios e de integracao.

**Dependencias**

- ARCH-FG-001-01

**Aceite**

- o backend rejeita matriz duplicada, filial em empresa errada e payload invalido;
- os contratos ficam reutilizaveis no monorepo.

### BE-FG-001-02 - Grants, contexto e autorizacao por escopo

**Objetivo**

Implementar grants por empresa/estabelecimento, contexto ativo de escrita e escopo multiplo de leitura.

**Entregaveis**

- servico de grants;
- servico de contexto;
- middleware/autorizacao por tenant, empresa e estabelecimento;
- auditoria de troca de contexto e acesso negado.

**Dependencias**

- BE-FG-001-01
- ARCH-FG-001-02

**Aceite**

- leitura fora do grant e negada;
- escrita sem contexto unico valido e negada;
- perda de acesso invalida o contexto atual.

### BE-FG-001-03 - Politica de compartilhamento por dominio

**Objetivo**

Aplicar `scopeType` e `shareMode` nos dominios iniciais impactados por FG-001.

**Entregaveis**

- base de politicas por dominio;
- validacoes server-side de ownership;
- testes cobrindo `GLOBAL`, `COMPANY` e `ESTABLISHMENT`.

**Dependencias**

- BE-FG-001-02
- ARCH-FG-001-02

**Aceite**

- um registro nao pode ficar mais aberto que sua politica;
- compartilhamento indevido gera erro padronizado.

### BE-FG-001-04 - APIs de leitura consolidada

**Objetivo**

Entregar consultas consolidadas seguras, paginadas e rastreaveis.

**Entregaveis**

- endpoints consolidados;
- filtros por empresa, estabelecimento, periodo e dominio;
- paginacao obrigatoria e limites de resposta;
- testes de autorizacao e performance basica.

**Dependencias**

- BE-FG-001-02

**Aceite**

- consultas retornam apenas escopos autorizados;
- respostas sao previsiveis e nao estouram volume por padrao.

### BE-FG-001-05 - Motor de consolidacao total

**Objetivo**

Implementar a fundacao do processo formal de consolidacao.

**Entregaveis**

- entidade de `consolidationRun`;
- parametros por periodo, moeda, empresa e criterio;
- reconciliacao, eliminacao e rastreabilidade minima;
- processamento reexecutavel e auditavel.

**Dependencias**

- ARCH-FG-001-03
- BE-FG-001-04

**Aceite**

- uma run de consolidacao pode ser criada, processada, reprocessada e consultada;
- o sistema consegue explicar a origem dos dados consolidados.

### BE-FG-001-06 - Fluxos intercompany

**Objetivo**

Preparar a base de parceiros, relacoes e excecoes intercompany.

**Entregaveis**

- cadastro de parceiro intercompany;
- mapeamentos minimos;
- fila de divergencias;
- contratos de eventos e auditoria.

**Dependencias**

- BE-FG-001-05

**Aceite**

- transacoes entre empresas deixam de depender de improviso cross-company;
- erros e divergencias ficam rastreaveis.

## Frontend Flutter

### FE-FG-001-01 - Shell de contexto e sessao operacional

**Objetivo**

Implementar no app a exibicao persistente de contexto de leitura e escrita.

**Entregaveis**

- componente de contexto ativo;
- seletor responsivo de empresa/estabelecimento;
- tratamento de sessao sem contexto ou com contexto invalido;
- testes de widget.

**Dependencias**

- UX-FG-001-01
- BE-FG-001-02

**Aceite**

- o app mostra claramente o contexto ativo;
- o usuario nao consegue entrar em fluxos de escrita sem contexto valido.

### FE-FG-001-02 - Telas de cadastro estrutural

**Objetivo**

Implementar telas e formularios de empresa, matriz, filial e unidade operacional.

**Entregaveis**

- paginas de listagem, detalhe, criacao e edicao;
- validacao de formularios;
- estados de loading, vazio, erro e conflito;
- acessibilidade basica e feedback inline.

**Dependencias**

- UX-FG-001-02
- BE-FG-001-01

**Aceite**

- a navegacao principal nao depende de modal;
- os formularios previnem erros comuns antes do submit.

### FE-FG-001-03 - Gestao de grants e autorizacoes

**Objetivo**

Implementar a interface de vinculacao de usuarios a empresas e estabelecimentos.

**Entregaveis**

- pagina de grants;
- componentes de selecao por escopo;
- visualizacao de defaults e restricoes;
- tratamento de erros de autorizacao.

**Dependencias**

- FE-FG-001-02
- BE-FG-001-02

**Aceite**

- a interface impede selecoes inconsistentes;
- o usuario administrador entende claramente o impacto do grant salvo.

### FE-FG-001-04 - Visoes consolidadas

**Objetivo**

Implementar filtros multiempresa e dashboards consolidados iniciais.

**Entregaveis**

- filter bar multiempresa;
- indicadores e listagens consolidadas;
- drill-down ate o detalhe suportado;
- feedback de escopo aplicado e de processamento.

**Dependencias**

- UX-FG-001-03
- BE-FG-001-04

**Aceite**

- o usuario nao confunde leitura consolidada com contexto de escrita;
- filtros e resultados sao compreensiveis em mobile e web.

### FE-FG-001-05 - Conflito, retry e rede instavel

**Objetivo**

Melhorar resiliencia e consistencia da experiencia em cenarios reais.

**Entregaveis**

- tratamento de conflito por versao;
- retry orientado ao usuario;
- mensagens de perda de acesso ou falha temporaria;
- comportamento previsivel em rede instavel.

**Dependencias**

- FE-FG-001-01
- FE-FG-001-02

**Aceite**

- conflitos sao explicados sem perda silenciosa;
- o usuario sempre sabe se a acao foi gravada, recusada ou precisa de nova tentativa.

## QA

### QA-FG-001-01 - Matriz de testes de escopo e seguranca

**Objetivo**

Cobrir grants, contexto, leitura consolidada e bloqueios cross-company.

**Entregaveis**

- casos de teste funcionais;
- cenarios negativos;
- rastreabilidade para criterios de aceite da especificacao.

**Dependencias**

- BE-FG-001-02
- FE-FG-001-03

**Aceite**

- os principais cenarios positivos e negativos estao cobertos;
- cada regra critica tem pelo menos uma validacao objetiva.

### QA-FG-001-02 - Regressao de UX, acessibilidade e estados

**Objetivo**

Validar experiencia, mensagens, foco, navegacao e prevencao de erro.

**Entregaveis**

- roteiros de teste de widget e manual;
- cobertura de loading, vazio, erro, conflito e retry;
- checklist de acessibilidade do fluxo.

**Dependencias**

- FE-FG-001-01
- FE-FG-001-05

**Aceite**

- os fluxos principais sao navegaveis e compreensiveis;
- acoes destrutivas exigem confirmacao adequada.

### QA-FG-001-03 - Validacao de consolidacao e intercompany

**Objetivo**

Cobrir reconciliacao, eliminacoes, reprocessamento e rastreabilidade da consolidacao total.

**Entregaveis**

- cenarios de consolidacao;
- cenarios de excecao intercompany;
- evidencias de consistencia de origem e totalizacao.

**Dependencias**

- BE-FG-001-05
- BE-FG-001-06
- FE-FG-001-04

**Aceite**

- a consolidacao pode ser validada de forma reproduzivel;
- divergencias ficam visiveis e verificaveis.

## Operacao e Plataforma

### OPS-FG-001-01 - Observabilidade e auditoria operacional

**Objetivo**

Garantir diagnostico e rastreabilidade dos fluxos estruturais e de consolidacao.

**Entregaveis**

- eventos de auditoria mapeados;
- logs estruturados com `tenantId`, `companyId`, `establishmentId` e `correlationId`;
- health/readiness e diagnostico minimo.

**Dependencias**

- BE-FG-001-02
- BE-FG-001-05

**Aceite**

- a equipe consegue reconstruir quem alterou o que, em qual escopo e com qual resultado;
- erros de processamento e autorizacao ficam rastreaveis.

### OPS-FG-001-02 - Dados de teste, seeds e homologacao

**Objetivo**

Disponibilizar ambientes e massa minima para testar cenarios multiempresa de ponta a ponta.

**Entregaveis**

- seeds com multiplas empresas e estabelecimentos;
- usuarios com grants distintos;
- cenarios de consolidacao e intercompany controlados.

**Dependencias**

- BE-FG-001-01
- BE-FG-001-02

**Aceite**

- QA e produto conseguem reproduzir cenarios sem montar dados manualmente a cada rodada.

### OPS-FG-001-03 - Rollout, guardrails e suporte inicial

**Objetivo**

Preparar a ativacao gradual da funcionalidade sem quebrar os modulos dependentes.

**Entregaveis**

- estrategia de feature flag ou rollout controlado;
- plano de rollback;
- checklist de suporte e monitoracao pos-liberacao.

**Dependencias**

- OPS-FG-001-01
- QA-FG-001-01

**Aceite**

- existe caminho seguro para habilitar, observar e recuar a feature;
- a operacao sabe o que monitorar nos primeiros dias.

## 5. Sequencia recomendada

| Ordem | Bloco | Tickets |
| --- | --- | --- |
| 1 | Fechamento funcional | `PO-FG-001-01`, `PO-FG-001-02` |
| 2 | Fundacao arquitetural | `ARCH-FG-001-01`, `ARCH-FG-001-02` |
| 3 | Base UX | `UX-FG-001-01`, `UX-FG-001-02` |
| 4 | Base backend | `BE-FG-001-01`, `BE-FG-001-02` |
| 5 | Base frontend | `FE-FG-001-01`, `FE-FG-001-02`, `FE-FG-001-03` |
| 6 | Testes e seeds iniciais | `QA-FG-001-01`, `OPS-FG-001-02` |
| 7 | Consolidado governado | `UX-FG-001-03`, `BE-FG-001-03`, `BE-FG-001-04`, `FE-FG-001-04` |
| 8 | Hardening de experiencia | `FE-FG-001-05`, `QA-FG-001-02`, `OPS-FG-001-01` |
| 9 | Consolidacao total | `ARCH-FG-001-03`, `BE-FG-001-05`, `QA-FG-001-03` |
| 10 | Intercompany e rollout | `BE-FG-001-06`, `OPS-FG-001-03` |

## 6. Definicao de pronto

Um ticket de FG-001 so deve entrar em implementacao quando:

- estiver vinculado ao documento funcional base;
- tiver criterio de aceite objetivo;
- tiver dependencia anterior resolvida ou explicitamente aceita;
- tiver impacto em seguranca e escopo avaliado;
- tiver estrategia minima de teste definida.

## 7. Definicao de concluido

Um ticket de FG-001 so deve ser considerado concluido quando:

- codigo, contratos e documentacao estiverem coerentes;
- testes automatizados e evidencias manuais relevantes existirem;
- auditoria e mensagens de erro aplicaveis estiverem cobertas;
- o comportamento em leitura e escrita estiver claro para o usuario;
- riscos residuais estiverem documentados.

## 8. Validacao por disciplina

| Disciplina | Como validar |
| --- | --- |
| Produto | checklist contra a especificacao funcional e criterios de aceite |
| UX/UI | prototipos navegaveis, estados de erro e acessibilidade revisados |
| Arquitetura | diagramas, contratos e regras de escopo aprovados |
| Backend | testes unitarios/integracao, autorizacao, auditoria e validacoes |
| Frontend | testes de widget, navegacao, formularios e estados resilientes |
| QA | matriz de casos cobrindo positivo, negativo, borda e regressao |
| Operacao | seeds, logs, health/readiness e plano de rollout verificados |

## 9. Riscos de execucao

- tentar implementar consolidacao total cedo demais sem fechar o desenho canonico;
- permitir leitura multiempresa sem separar claramente o contexto de escrita;
- tratar CNPJ como unica fonte para identificar matriz;
- abrir compartilhamento de dados por conveniencia e nao por politica;
- subestimar a necessidade de seeds e cenarios de QA multiempresa.

## 10. Proximo passo recomendado

Criar tickets reais no sistema de gestao do time a partir deste plano, preservando os IDs propostos e vinculando cada ticket ao documento funcional e ao backlog de FG-001.
