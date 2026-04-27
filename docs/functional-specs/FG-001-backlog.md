# Backlog de Implementacao - FG-001 Multiempresa e Multifilial

## 1. Objetivo

Este documento transforma a especificacao funcional `FG-001` em backlog executavel para UX/UI, arquitetura, backend, frontend, QA e operacao.

Documento base:

- [FG-001-multiempresa-multifilial.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-multiempresa-multifilial.md)
- [FG-001-execution-plan.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-execution-plan.md)
- [FG-001-ux-ui-spec.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-ux-ui-spec.md)

## 2. Resultado esperado

Ao concluir este backlog, o EixoOne deve conseguir:

- estruturar `empresa`, `matriz`, `filial` e `unidade operacional`;
- controlar permissao e contexto por escopo;
- impedir vazamento e escrita cross-company indevida;
- suportar leitura consolidada;
- suportar consolidacao completa e total;
- suportar fluxo intercompany governado;
- registrar auditoria e rastreabilidade de ponta a ponta.

## 3. Principios de implementacao

1. `empresa` e a entidade legal do sistema.
2. `matriz` e `filial` sao estabelecimentos da empresa.
3. leitura pode ser multiempresa; escrita deve ter contexto unico.
4. compartilhamento entre empresas e sempre explicito.
5. consolidacao nao e um dashboard simples; e um processo formal.
6. toda decisao relevante deve gerar trilha auditavel.
7. implementacao deve ser fatiada sem quebrar a modelagem final.

## 4. Fatias de entrega recomendadas

### Fase 1 - Fundacao estrutural

- modelo organizacional;
- cadastros de empresa e estabelecimento;
- grants por empresa/estabelecimento;
- contexto operacional unico para escrita;
- auditoria estrutural.

### Fase 2 - Leitura consolidada e escopo governado

- filtros multiempresa;
- visoes consolidadas iniciais;
- politica de escopo e compartilhamento por dominio;
- bloqueios de autorizacao cross-company.

### Fase 3 - Consolidacao completa

- parametros de consolidacao;
- mapeamento de contas e dimensoes;
- moedas, percentuais, calendarios;
- runs de consolidacao;
- divergencias, reconciliacao e eliminacoes.

### Fase 4 - Intercompany e operacao corporativa

- parceiros intercompany;
- documentos e lancamentos espelhados;
- fila de excecoes;
- conciliacao e fechamento corporativo.

## 5. Epicos

| Epico | Nome | Objetivo | Prioridade | Fase |
| --- | --- | --- | --- | --- |
| E01 | Modelo Organizacional | materializar empresa, matriz, filial e unidade operacional | Alta | 1 |
| E02 | Contexto e Autorizacao | garantir operacao no escopo correto | Alta | 1 |
| E03 | Compartilhamento por Dominio | definir escopo e politicas de compartilhamento | Alta | 2 |
| E04 | UX de Multiempresa | entregar experiencia clara e segura de navegacao | Alta | 1-2 |
| E05 | Integracao com Modulos Dependentes | propagar empresa/estabelecimento para usuarios, estoque, financeiro e fiscal | Alta | 2 |
| E06 | Leitura Consolidada | permitir visao agregada autorizada | Alta | 2 |
| E07 | Consolidacao Completa | consolidar dados organizacionais, operacionais e financeiros | Alta | 3 |
| E08 | Intercompany | tratar operacoes entre empresas com fluxo proprio | Alta | 4 |
| E09 | Auditoria e Observabilidade | garantir trilha, monitoracao e diagnostico | Alta | 1-4 |
| E10 | QA, Rollout e Governanca | validar, homologar e liberar com seguranca | Alta | 1-4 |

## 6. Historias de usuario por epico

## E01 - Modelo Organizacional

### FG-001-E01-US01 - Cadastrar empresa

**Como** administrador  
**Quero** cadastrar uma empresa com dados juridicos e tributarios  
**Para** representar corretamente a entidade legal no EixoOne

**Aceite**

- a empresa exige razao social, natureza juridica, pais, data de abertura e regime tributario;
- a empresa recebe identificador interno imutavel;
- o cadastro gera auditoria;
- o cadastro nao permite regime invalido.

**Dependencias**

- nenhuma

### FG-001-E01-US02 - Cadastrar matriz

**Como** administrador  
**Quero** cadastrar a matriz principal de uma empresa  
**Para** definir o estabelecimento principal da operacao

**Aceite**

- uma empresa nao pode ter duas matrizes principais ativas;
- o tipo do estabelecimento deve ser explicito;
- o sistema nao pode depender apenas do sufixo do CNPJ;
- CNAE principal deve ser obrigatorio.

**Dependencias**

- FG-001-E01-US01

### FG-001-E01-US03 - Cadastrar filial

**Como** administrador  
**Quero** cadastrar filiais vinculadas a uma empresa  
**Para** representar estabelecimentos operacionais adicionais

**Aceite**

- filial pertence a uma unica empresa;
- filial possui dados cadastrais proprios;
- sistema valida CNPJ, ordem do estabelecimento e CNAE;
- cadastro gera auditoria.

**Dependencias**

- FG-001-E01-US01

### FG-001-E01-US04 - Suportar matriz administrativa

**Como** administrador  
**Quero** marcar uma matriz como administrativa  
**Para** permitir que a operacao fique nas filiais sem quebrar a modelagem

**Aceite**

- matriz administrativa pode existir sem estoque, caixa ou execucao operacional;
- filiais operacionais podem continuar funcionando normalmente;
- regras de exibicao e consolidacao respeitam esse modo.

**Dependencias**

- FG-001-E01-US02

### FG-001-E01-US05 - Cadastrar unidade operacional

**Como** administrador  
**Quero** cadastrar unidades operacionais abaixo da estrutura principal  
**Para** representar loja, CD, planta ou escritorio sem criar nova entidade legal

**Aceite**

- unidade operacional deve se vincular a empresa ou estabelecimento conforme regra aprovada;
- unidade operacional nao substitui empresa nem estabelecimento;
- o uso da unidade operacional deve ser opcional.

**Dependencias**

- FG-001-E01-US01
- FG-001-E01-US02
- FG-001-E01-US03

## E02 - Contexto e Autorizacao

### FG-001-E02-US01 - Vincular usuario a empresas

**Como** administrador  
**Quero** conceder acesso do usuario a uma ou mais empresas  
**Para** restringir o que ele pode ver e operar

**Aceite**

- grants por empresa sao persistidos;
- usuario nao pode operar empresa fora do grant;
- alteracoes ficam auditadas.

### FG-001-E02-US02 - Vincular usuario a estabelecimentos

**Como** administrador  
**Quero** conceder acesso a estabelecimentos especificos  
**Para** controlar a operacao por matriz e filial

**Aceite**

- estabelecimento concedido deve pertencer a empresa concedida;
- sistema bloqueia grants inconsistentes;
- grants de estabelecimento podem ser mais restritivos que grants de empresa.

**Dependencias**

- FG-001-E02-US01

### FG-001-E02-US03 - Selecionar contexto unico de escrita

**Como** usuario autorizado  
**Quero** selecionar uma empresa e um estabelecimento ativos  
**Para** gravar dados no escopo correto

**Aceite**

- toda tela de escrita exige contexto ativo valido;
- contexto ativo fica visivel de forma persistente;
- troca de contexto recalcula permissoes e defaults.

**Dependencias**

- FG-001-E02-US01
- FG-001-E02-US02

### FG-001-E02-US04 - Permitir escopo multiplo de leitura

**Como** gestor corporativo  
**Quero** selecionar varias empresas e filiais para consulta  
**Para** analisar dados consolidados sem trocar o contexto de escrita

**Aceite**

- filtros de leitura podem usar varios escopos autorizados;
- o contexto de escrita nao muda automaticamente;
- o usuario entende claramente a diferenca entre leitura e escrita.

**Dependencias**

- FG-001-E02-US03

### FG-001-E02-US05 - Bloquear acesso cross-company indevido

**Como** sistema  
**Quero** negar acesso fora do escopo autorizado  
**Para** manter isolamento e seguranca

**Aceite**

- consultas fora do grant retornam bloqueio;
- mutacoes fora do contexto retornam bloqueio;
- tentativa negada gera evento auditavel.

**Dependencias**

- FG-001-E02-US01
- FG-001-E02-US02
- FG-001-E02-US03

## E03 - Compartilhamento por Dominio

### FG-001-E03-US01 - Definir escopo de dado

**Como** arquiteto de produto  
**Quero** que cada dominio possua `scopeType`  
**Para** explicitar se o dado e global, por empresa ou por estabelecimento

**Aceite**

- cadastro de dominio suporta `GLOBAL`, `COMPANY` e `ESTABLISHMENT`;
- comportamento padrao e restritivo;
- a documentacao lista o escopo padrao por dominio.

### FG-001-E03-US02 - Definir modo de compartilhamento

**Como** arquiteto de produto  
**Quero** que dados elegiveis tenham `shareMode`  
**Para** controlar registro unico, replicado ou sem compartilhamento

**Aceite**

- sistema suporta `NONE`, `SINGLE_MASTER` e `REPLICATED`;
- `NONE` e o padrao;
- alteracao de politica gera auditoria.

**Dependencias**

- FG-001-E03-US01

### FG-001-E03-US03 - Governar politicas por dominio

**Como** administrador  
**Quero** configurar politicas de compartilhamento por dominio  
**Para** permitir reuso de cadastro sem abrir risco operacional

**Aceite**

- politicas indicam dominios, empresas participantes e modo de compartilhamento;
- mudancas de politica exigem permissao elevada;
- politicas nao podem ser ativadas se quebrarem consistencia conhecida.

**Dependencias**

- FG-001-E03-US01
- FG-001-E03-US02

## E04 - UX de Multiempresa

### FG-001-E04-US01 - Exibir contexto ativo com clareza

**Como** usuario  
**Quero** sempre ver empresa e estabelecimento ativos  
**Para** evitar gravacao no escopo errado

**Aceite**

- cabecalho exibe contexto de escrita;
- componentes de formulario exibem o escopo atual;
- mudancas de contexto mostram feedback claro.

### FG-001-E04-US02 - Navegar por empresas e filiais

**Como** usuario autorizado  
**Quero** consultar lista, detalhe e filtros de empresas e filiais  
**Para** gerenciar a estrutura sem friccao

**Aceite**

- existe lista de empresas;
- existe detalhe de empresa com seus estabelecimentos;
- existe filtro por status, tipo e regime;
- estados vazio, erro e carregamento sao cobertos.

### FG-001-E04-US03 - Gerenciar grants sem ambiguidade

**Como** administrador  
**Quero** vincular escopos em uma tela segura e compreensivel  
**Para** nao conceder acesso indevido por engano

**Aceite**

- tela diferencia grant de empresa e grant de estabelecimento;
- sistema impede combinacoes invalidas;
- alteracoes sensiveis pedem confirmacao clara.

## E05 - Integracao com Modulos Dependentes

### FG-001-E05-US01 - Propagar escopo para usuarios e permissoes

**Como** sistema  
**Quero** que usuarios e RBAC/ABAC reconhecam empresa e estabelecimento  
**Para** aplicar grants de forma consistente

### FG-001-E05-US02 - Propagar escopo para estoque

**Como** sistema  
**Quero** que warehouses, itens e movimentos respeitem estabelecimento  
**Para** impedir mistura de estoque entre filiais

### FG-001-E05-US03 - Propagar escopo para financeiro

**Como** sistema  
**Quero** que contas, caixas, bancos e lancamentos respeitem empresa e estabelecimento  
**Para** manter integridade contabil e operacional

### FG-001-E05-US04 - Propagar escopo para fiscal

**Como** sistema  
**Quero** que serie, inscricoes, CNAE e parametros fiscais respeitem o nivel correto  
**Para** suportar operacao aderente e parametrizavel

### FG-001-E05-US05 - Propagar escopo para documentos transacionais

**Como** sistema  
**Quero** que pedidos, notas, faturas e anexos herdem o escopo correto  
**Para** manter rastreabilidade e bloqueio cross-company

## E06 - Leitura Consolidada

### FG-001-E06-US01 - Dashboard consolidado por escopo autorizado

**Como** gestor corporativo  
**Quero** ver indicadores consolidados por varias empresas e filiais  
**Para** acompanhar a operacao de forma centralizada

**Aceite**

- usuario seleciona empresas/filiais autorizadas;
- dashboard consolida somente escopos permitidos;
- existe drill-down para empresa, filial e origem.

### FG-001-E06-US02 - Busca e listagem cross-company controlada

**Como** gestor corporativo  
**Quero** buscar registros em varios escopos autorizados  
**Para** localizar rapidamente informacoes distribuidas

**Aceite**

- consulta respeita grants;
- filtros mostram empresa e estabelecimento;
- usuario com leitura consolidada nao recebe edicao por heranca.

### FG-001-E06-US03 - Exportacao consolidada auditavel

**Como** gestor corporativo ou auditor  
**Quero** exportar relatorios consolidados  
**Para** analisar e compartilhar informacoes com rastreabilidade

**Aceite**

- exportacao registra quem gerou, filtro usado e escopo envolvido;
- dados exportados respeitam grants;
- volume alto pode virar processamento assincrono.

## E07 - Consolidacao Completa

### FG-001-E07-US01 - Configurar hierarquia de consolidacao

**Como** controladoria  
**Quero** definir grupos, empresas participantes e percentuais  
**Para** estabelecer a consolidacao corporativa

### FG-001-E07-US02 - Mapear plano de contas consolidado

**Como** controladoria  
**Quero** mapear contas locais para contas consolidadas  
**Para** consolidar resultados financeiros corretamente

### FG-001-E07-US03 - Configurar moedas e taxas

**Como** controladoria  
**Quero** configurar moedas e criterios de conversao  
**Para** consolidar empresas com moedas diferentes

### FG-001-E07-US04 - Configurar calendarios e periodos

**Como** controladoria  
**Quero** harmonizar calendarios fiscais e contabeis  
**Para** consolidar empresas com estruturas temporais diferentes

### FG-001-E07-US05 - Executar run de consolidacao

**Como** gestor corporativo ou controladoria  
**Quero** rodar consolidacao total  
**Para** gerar resultado consolidado confiavel e rastreavel

**Aceite**

- run guarda parametros, timestamp, ator e empresas participantes;
- sistema executa pre-validacoes;
- resultado fica disponivel para consulta e auditoria.

### FG-001-E07-US06 - Tratar divergencias e reconciliacoes

**Como** controladoria  
**Quero** revisar divergencias de consolidacao  
**Para** corrigir pendencias antes do fechamento

### FG-001-E07-US07 - Aplicar eliminacoes

**Como** controladoria  
**Quero** registrar e aplicar eliminacoes intercompany  
**Para** evitar duplicidade de resultado no consolidado

### FG-001-E07-US08 - Rastrear o consolidado ate a origem

**Como** auditor  
**Quero** abrir o consolidado e chegar aos registros de origem  
**Para** validar o fechamento com transparencia

## E08 - Intercompany

### FG-001-E08-US01 - Cadastrar parceiros intercompany

**Como** controladoria  
**Quero** definir empresas parceiras entre si  
**Para** habilitar fluxo intercompany governado

### FG-001-E08-US02 - Mapear contas e dimensoes intercompany

**Como** controladoria  
**Quero** mapear contrapartidas, contas e dimensoes  
**Para** permitir geracao correta de documentos e lancamentos

### FG-001-E08-US03 - Espelhar documentos intercompany

**Como** sistema  
**Quero** gerar contraparte intercompany conforme politica  
**Para** reduzir trabalho manual e manter simetria

### FG-001-E08-US04 - Conciliar excecoes intercompany

**Como** financeiro/controladoria  
**Quero** revisar divergencias entre empresas  
**Para** corrigir falhas antes da consolidacao

## E09 - Auditoria e Observabilidade

### FG-001-E09-US01 - Auditar alteracoes estruturais

**Como** auditor  
**Quero** trilha completa de criacao e alteracao de empresa/estabelecimento  
**Para** reconstruir o historico organizacional

### FG-001-E09-US02 - Auditar trocas de contexto

**Como** auditor  
**Quero** rastrear mudancas de empresa e filial ativa  
**Para** analisar comportamento e incidentes

### FG-001-E09-US03 - Auditar grants e bloqueios

**Como** auditor  
**Quero** ver concessoes de acesso e tentativas negadas  
**Para** validar governanca de seguranca

### FG-001-E09-US04 - Observar runs de consolidacao

**Como** operacao  
**Quero** monitorar status, falhas e tempos de consolidacao  
**Para** agir rapidamente em incidentes

## E10 - QA, Rollout e Governanca

### FG-001-E10-US01 - Montar matriz de autorizacao de testes

**Como** QA  
**Quero** uma matriz de papeis x empresas x filiais x acoes  
**Para** validar horizontal e verticalmente os acessos

### FG-001-E10-US02 - Validar cenarios de borda

**Como** QA  
**Quero** validar CNPJ alfanumerico, matriz administrativa, grants invalidos e consolidacao multi-moeda  
**Para** reduzir risco de regressao

### FG-001-E10-US03 - Preparar rollout controlado

**Como** produto/operacao  
**Quero** habilitar a funcionalidade por fases  
**Para** reduzir impacto em clientes e equipes

## 7. Sequenciamento tecnico recomendado

### Bloco A - Pronto para backend base

1. E01
2. E02
3. E09 parcial

### Bloco B - Pronto para frontend base

1. E04
2. E02 integrado
3. E01 integrado

### Bloco C - Pronto para modulos dependentes

1. E03
2. E05
3. E06

### Bloco D - Pronto para fechamento corporativo

1. E07
2. E08
3. E09 completo
4. E10

## 8. Entregaveis por disciplina

### Produto

- backlog priorizado;
- definicao de releases;
- matriz de dependencias;
- regras de escopo aprovadas.

### UX/UI

- fluxo de navegacao;
- seletor de contexto;
- lista e detalhe de empresa/estabelecimento;
- tela de grants;
- dashboard consolidado;
- estados de erro, loading, vazio e conflito.

### Arquitetura

- modelo canonico de organizacao;
- padrao de chaves de escopo;
- politica de compartilhamento;
- desenho de consolidacao e intercompany;
- estrategia de auditoria.

### Backend

- entidades, schemas e validacoes;
- middlewares de contexto e autorizacao;
- APIs de empresa, estabelecimento, grants e consolidacao;
- regras de consistencia cross-company;
- eventos e auditoria.

### Frontend

- rotas e paginas;
- services/repositories por escopo;
- persistencia de contexto;
- filtros de leitura consolidada;
- tratamento de erro e feedback.

### QA

- matriz de acesso;
- testes positivos e negativos;
- cenarios de consolidacao;
- regressao nos modulos dependentes;
- teste de rastreabilidade.

## 9. Criticos para definicao de pronto

Uma historia so deve entrar em desenvolvimento se:

- a regra funcional estiver fechada na especificacao;
- o escopo do dado estiver definido;
- os grants estiverem claros;
- o impacto em auditoria estiver descrito;
- o criterio de aceite estiver verificavel.

## 10. Criticos para definicao de concluido

Uma historia so deve ser considerada concluida se:

- backend aplicar as validacoes e autorizacoes esperadas;
- frontend refletir corretamente o contexto e o bloqueio;
- auditoria estiver gerada quando aplicavel;
- testes cobrirem sucesso, negacao e borda;
- documentacao minima estiver atualizada.

## 11. Riscos de execucao

1. Tratar empresa como filial ou filial como empresa quebra todo o restante.
2. Permitir escrita com contexto multiplo tende a gerar inconsistencias.
3. Compartilhar dados sem politica explicita aumenta risco de vazamento.
4. Consolidacao sem mapeamento e reconciliacao gera resultado enganoso.
5. Intercompany implicito aumenta risco financeiro e contabil.

## 12. Ordem de priorizacao sugerida

| Ordem | Item | Motivo |
| --- | --- | --- |
| 1 | E01 | fundacao do modelo |
| 2 | E02 | seguranca e consistencia minima |
| 3 | E04 | clareza operacional para o usuario |
| 4 | E03 | governanca de dados |
| 5 | E05 | propagacao para dominios dependentes |
| 6 | E06 | valor gerencial rapido |
| 7 | E09 | rastreabilidade e observabilidade |
| 8 | E07 | consolidacao total |
| 9 | E08 | intercompany completo |
| 10 | E10 | rollout e validacao final |

## 13. Proximo passo recomendado

Quebrar este backlog em tickets implementaveis por stack, por exemplo:

- `ARCH-FG-001-*`
- `BE-FG-001-*`
- `FE-FG-001-*`
- `UX-FG-001-*`
- `QA-FG-001-*`

com estimativa, dependencia e release alvo.
