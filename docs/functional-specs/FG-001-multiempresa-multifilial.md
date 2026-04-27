# Especificacao Funcional - FG-001 Multiempresa e Multifilial

## Documentos relacionados

- [FG-001-backlog.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-backlog.md)
- [FG-001-execution-plan.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-execution-plan.md)
- [FG-001-ux-ui-spec.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-ux-ui-spec.md)

## 1. Resumo executivo

A funcionalidade `FG-001 - Multiempresa e multifilial` define a base organizacional, operacional e de seguranca do EixoOne para operacao de multiplas empresas, matriz, filiais e unidades operacionais dentro do mesmo tenant. Esta especificacao consolida os requisitos da planilha com benchmark de mercado e referencias oficiais para produzir um documento funcional completo, verificavel e pronto para UX/UI, arquitetura, backend, frontend, QA e produto.

O resultado final recomendado para o EixoOne e:

- `empresa` representa a entidade legal/contabil principal;
- `matriz` e `filial` representam estabelecimentos da mesma empresa;
- leitura consolidada pode abranger multiplas empresas e filiais autorizadas;
- escrita transacional exige contexto operacional unico e explicito;
- compartilhamento de dados entre empresas deve ser excecao governada por politica;
- a consolidacao deve ser completa e total, incluindo dimensao organizacional, operacional, financeira, contabil e intercompany.

## 2. Dados da planilha

### Funcionalidade analisada

- ID: `FG-001`
- Modulo: `Base e Governanca`
- Nome: `Multiempresa e multifilial`
- Objetivo: permitir operar matriz, filiais e unidades de negocio dentro do mesmo sistema, com regras e dados segregados quando necessario
- Problema de negocio que resolve: a empresa precisa controlar dados, documentos, usuarios, estoques, contas e regras fiscais por unidade operacional sem misturar responsabilidades
- Usuarios envolvidos: administrador da plataforma, gestor corporativo, gestor de empresa, gestor de filial, operador, auditor, usuario de integracao/API
- Dependencias: usuarios, permissoes, fiscal, financeiro, estoque
- Prioridade: `Alta`
- Complexidade: `Muito Alta`
- MVP: `Sim`
- Status: `Backlog`

### Requisitos de negocio extraidos

- controlar dados e responsabilidades por unidade operacional;
- impedir mistura de operacao entre empresas;
- permitir consolidacao de informacoes;
- suportar contexto organizacional para modulos fiscal, financeiro e estoque.

### Requisitos funcionais extraidos

- cadastrar matriz e filiais;
- definir empresa ativa;
- vincular usuarios, documentos, estoque e financeiro a filial;
- consolidar relatorios;
- bloquear acesso indevido entre empresas.

### Requisitos nao funcionais extraidos

- segregacao forte de dados;
- auditoria por empresa;
- desempenho adequado em consultas consolidadas;
- alta disponibilidade;
- trilha de permissoes.

## 3. Diagnostico inicial

O levantamento inicial mostrava cinco lacunas relevantes: definicao exata de `empresa` versus `matriz/filial`, detalhamento do regime tributario, profundidade da consolidacao, estrategia de multiempresa simultanea e politica de compartilhamento por dominio. Essas lacunas foram resolvidas por pesquisa em sistemas de referencia e fontes oficiais brasileiras.

## 4. Pesquisa de mercado e referencias

### Fontes pesquisadas

| Fonte | Sistema/Referencia | O que foi encontrado | Aplicacao na especificacao | Confiabilidade |
| --- | --- | --- | --- | --- |
| [Receita Federal - CNPJ](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj) | Fonte oficial brasileira | ha procedimentos distintos para inscricao de matriz e filial | matriz e filial sao estabelecimentos distintos no sistema | Alta |
| [Receita Federal - Dados da base CNPJ](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/convenios-e-transferencias/compartilhamento-de-bases-de-dados-2013-decreto-no-8-789-2016/leiaute-das-bases/dados-da-base-cnpj) | Fonte oficial brasileira | base publica contem indicador de matriz/filial, natureza juridica, CNAE, situacao, porte, opcao SIMEI e Simples | campos minimos obrigatorios do cadastro empresarial | Alta |
| [Receita Federal - Orientacoes sobre CNAE no CNPJ](https://www.gov.br/receitafederal./pt-br/canais_atendimento/fale-conosco/empresa/cnpj/orientacoes-sobre-cnae) | Fonte oficial brasileira | o CNAE deve refletir as atividades efetivamente exercidas em cada estabelecimento | CNAE deve existir no nivel do estabelecimento | Alta |
| [Receita Federal - CNPJ alfanumerico](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf) | Fonte oficial brasileira | novas inscricoes podem ser alfanumericas a partir de julho de 2026 e o sufixo `0001` nao pode ser tratado como identificador definitivo de matriz | o sistema nao pode inferir matriz/filial apenas pelo padrao visual do CNPJ | Alta |
| [Simples Nacional - O que e o Simples Nacional](https://www8.receita.fazenda.gov.br/SimplesNacional/Documentos/Pagina.aspx?id=3+) | Fonte oficial brasileira | Simples Nacional e regime compartilhado para ME/EPP | campo de regime tributario deve ser explicito | Alta |
| [gov.br - Optar pelo Simples Nacional](https://www.gov.br/pt-br/servicos/optar-pelo-simples-nacional) | Fonte oficial brasileira | o Simples unifica diversos tributos e a opcao faz parte da operacao tributaria da empresa | reforca regime tributario no nivel da empresa | Alta |
| [gov.br - Microempreendedor Individual](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes/como-e-feita-a-formalizacao-do-mei/o-microempreendedor-individual-mei) | Fonte oficial brasileira | o MEI e empresario individual e nao pode ter socio | `MEI` deve existir como caso funcional especifico | Alta |
| [Dynamics 365 - Define the organizational structure](https://learn.microsoft.com/en-us/dynamics365/guidance/organizational-strategy/define-organizational-strategy) | Microsoft Dynamics 365 | separa legal entity/company de operating units e recomenda nao criar entidades legais para divisoes que nao sejam juridicamente separadas | `empresa` nao pode ser confundida com `filial` ou unidade operacional | Alta |
| [Dynamics 365 - Cross-company data sharing overview](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/sysadmin/srs-overview) | Microsoft Dynamics 365 | compartilhamento cross-company deve ser feito por politica, tabelas, campos e empresas participantes | define politica de compartilhamento por dominio | Alta |
| [Dynamics 365 - Cross-company product sharing](https://learn.microsoft.com/en-us/dynamics365/supply-chain/pim/share-products-across-companies) | Microsoft Dynamics 365 | diferencia compartilhamento por registro unico e por replicacao | base para `shareMode` do EixoOne | Alta |
| [NetSuite OneWorld - Restricting Role Access to Subsidiaries](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_N286421.html) | NetSuite OneWorld | papel pode ser restrito a subsidiarias especificas e ha diferenca entre ver e editar | leitura e escrita precisam de regras diferentes | Alta |
| [NetSuite OneWorld - Subsidiary Navigator](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_3808545097.html) | NetSuite OneWorld | sessao pode restringir visao por subsidiaria | base para seletor de contexto | Alta |
| [Odoo - Multi-company](https://www.odoo.com/documentation/19.0/es_419/applications/general/companies/multi_company.html) | Odoo | usuario pode abrir multiplas empresas; registros podem ser compartilhados ou especificos | leitura multiempresa e politica de escopo | Alta |
| [Odoo - Multi-company Guidelines](https://www.odoo.com/documentation/19.0/es_419/developer/howtos/company.html) | Odoo | multiempresa simultanea pode gerar inconsistencias se a empresa corrente nao for controlada | escrita deve exigir contexto unico | Alta |
| [Business Central - Consolidate financial data from multiple companies](https://learn.microsoft.com/en-gb/dynamics365/business-central/finance-consolidated-company-reporting) | Microsoft Business Central | consolidacao envolve empresas, moedas, percentuais, calendario, eliminacoes e testes previos | define consolidacao completa e total | Alta |
| [Business Central - Set up intercompany transactions](https://learn.microsoft.com/en-us/dynamics365/business-central/intercompany-how-setup) | Microsoft Business Central | intercompany exige parceiros, mapeamentos e processo de tratamento de duplicidade | intercompany deve ser fluxo proprio, nao implicito | Alta |
| [SAP Business One - How to Work with Multiple Branches](https://help.sap.com/doc/048e30b80b7d4af68a3f28ba6c96446b/10.0/en-US/How_to_Work_with_Multiple_Branches_in_SAP_Business_One.pdf) | SAP Business One | diferencia branch filtering de data ownership by branch | filtro visual nao substitui autorizacao real | Alta |
| [Anvisa - Matriz e filial](https://www.gov.br/anvisa/pt-br/acessoainformacao/perguntasfrequentes/administrativo/autorizacao-de-funcionamento-afe-ou-ae/matriz-e-filial) | Fonte oficial brasileira | certas autorizacoes sao extensivas da matriz; outras sao por estabelecimento | sistema deve suportar requisitos regulatorios em niveis diferentes | Alta |
| [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) | OWASP | validacao por allowlist, cliente + servidor, validacao sintatica e semantica | campos e validacoes | Alta |
| [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) | OWASP | auditoria deve registrar quem, o que, resultado e identificador da interacao; mascarar dados sensiveis | auditoria e rastreabilidade | Alta |
| [OWASP Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) | OWASP | autorizacao deve ser server-side e default deny | seguranca de acesso por escopo | Alta |

### Boas praticas consolidadas

1. Separar entidade legal de estabelecimento.
2. Exigir contexto operacional explicito para escrita.
3. Permitir leitura consolidada sem abrir edicao cross-company por padrao.
4. Tratar compartilhamento como politica governada.
5. Registrar auditoria para alteracoes estruturais, de contexto e de permissao.
6. Tratar consolidacao como processo formal com parametros, validacoes e rastreabilidade.

## 5. Benchmark funcional

| Sistema/Referencia | Como a funcionalidade funciona | Recursos principais | Validacoes observadas | Pontos fortes | Limitacoes percebidas |
| --- | --- | --- | --- | --- | --- |
| Dynamics 365 | separa legal entity/company de operating units; compartilha dados por politica | legal entity, company, data area, DRS/SRS | validacao por escopo e politica | modelagem forte e consistente | modelagem errada cedo gera retrabalho alto |
| NetSuite OneWorld | acesso e visao por subsidiarias, com restricao por papel e por sessao | role restriction, subsidiary navigator, consolidated visibility | diferenca entre visualizar e editar | boa governanca de leitura x escrita | pode induzir erro se contexto nao estiver visivel |
| Odoo | permite varias empresas abertas; registros podem ser globais ou especificos | company selector, company field, consistency rules | risco de inconsistencia se empresa corrente nao for respeitada | flexibilidade grande | exige muito controle funcional |
| SAP Business One | branches servem para filtragem e ownership real | branch filtering, data ownership, branch assignment | usuario, item, parceiro e armazem por filial | separa filtro de autorizacao | filtragem sozinha nao e seguranca |
| Business Central | consolidacao usa empresa consolidada, mapeamento e eliminacoes | consolidated company, intercompany, eliminations | testes previos, mapeamento e eliminacoes | referencia forte para consolidacao total | aumenta muito a complexidade funcional |

### Recomendacoes finais para o EixoOne

1. Adotar `tenant -> grupo economico opcional -> empresa -> estabelecimento -> unidade operacional`.
2. Definir `empresa` como entidade legal e `matriz/filial` como estabelecimentos.
3. Permitir multiselecionar escopos so para leitura.
4. Exigir contexto unico ativo para escrita.
5. Implementar politica de escopo e compartilhamento por dominio.
6. Tratar consolidacao completa como processo funcional formal, com parametros, validacoes e rastreabilidade.

## 6. Visao da funcionalidade

### 6.1 Objetivo

Permitir estruturar, operar e governar multiplas empresas, matriz, filiais e unidades operacionais dentro do EixoOne, com segregacao de dados, autorizacao por escopo, troca controlada de contexto e consolidacao completa das informacoes.

### 6.2 Problema de negocio

Sem essa funcionalidade, dados operacionais, fiscais, financeiros e de estoque podem ser misturados entre empresas e estabelecimentos, gerando risco de erro operacional, falha de governanca, inconsistencias contabeis, exposicao indevida de dados e baixa confiabilidade em relatorios corporativos.

### 6.3 Valor para o usuario

- operar sempre no contexto correto;
- reduzir erros entre empresa e filial;
- facilitar leitura consolidada;
- dar clareza sobre onde o usuario esta gravando;
- permitir rastreabilidade e responsabilidade por unidade.

### 6.4 Valor para a empresa

- governanca multiempresa consistente;
- segregacao real entre operacoes;
- suporte a crescimento com varias entidades;
- consolidacao corporativa completa;
- base segura para fiscal, financeiro, estoque, CRM e auditoria.

### 6.5 Escopo

#### Dentro do escopo

- cadastro e manutencao de empresa;
- cadastro e manutencao de matriz e filiais;
- hierarquia organizacional;
- selecao de contexto operacional;
- vinculo de usuarios a empresas e estabelecimentos;
- politicas de escopo e compartilhamento;
- leitura consolidada;
- consolidacao completa e total;
- intercompany funcional;
- auditoria e rastreabilidade.

#### Fora do escopo

- legislacao fiscal implementada de forma fixa no codigo;
- obrigacoes setoriais especificas sem parametrizacao;
- reorganizacao societaria retroativa automatica;
- migracao de historico legado fora de fluxo controlado.

### 6.6 Premissas

- `tenant` e o limite maximo de isolamento do cliente;
- uma empresa pode possuir uma matriz principal e varias filiais;
- matriz pode ser operacional ou apenas administrativa;
- licencas, inscricoes e regras podem existir no nivel empresa ou estabelecimento;
- consolidacao total pode incluir empresas em ambientes distintos, desde que homologados.

### 6.7 Restricoes

- nao expor dados entre tenants;
- nao permitir escrita sem contexto valido;
- nao inferir matriz/filial apenas pelo formato do CNPJ;
- nao confiar apenas no frontend para autorizacao;
- nao assumir regras fiscais nao confirmadas.

### 6.8 Dependencias

- autenticacao;
- autorizacao RBAC/ABAC;
- auditoria;
- cadastro de usuarios;
- fiscal;
- financeiro;
- estoque/WMS;
- relatorios e indicadores;
- integracoes e automacoes.

## 7. Escopo organizacional e definicoes oficiais do EixoOne

### 7.1 Hierarquia recomendada

```text
Tenant
└── GrupoEconomico (opcional)
    └── Empresa
        ├── Matriz (1)
        ├── Filiais (0..N)
        └── UnidadesOperacionais (0..N)
```

### 7.2 Definicoes finais

| Conceito | Definicao funcional final |
| --- | --- |
| `Tenant` | cliente do EixoOne; fronteira maxima de isolamento |
| `GrupoEconomico` | agrupador opcional de multiplas empresas do mesmo tenant |
| `Empresa` | entidade legal/contabil principal, com regime tributario, consolidacao e responsabilidade juridica |
| `Matriz` | estabelecimento principal de uma empresa |
| `Filial` | estabelecimento adicional da mesma empresa |
| `UnidadeOperacional` | loja, CD, planta, escritorio, departamento ou estrutura operacional sem identidade legal propria |

### 7.3 Regras estruturais

1. Uma empresa deve ter exatamente uma matriz principal ativa.
2. Uma filial pertence a uma unica empresa.
3. Matriz e filial sao tipos de estabelecimento.
4. O sistema deve persistir `tipoEstabelecimento` explicitamente.
5. O sistema deve aceitar CNPJ numerico e alfanumerico.
6. O sistema deve permitir matriz administrativa e filiais operacionais.
7. O sistema deve suportar licencas por empresa, por estabelecimento ou hibridas.

## 8. Usuarios, perfis e permissoes

| Perfil | Objetivo no fluxo | Permissoes necessarias | Restricoes |
| --- | --- | --- | --- |
| Administrador da plataforma | configurar estrutura empresarial e politicas | `governance.company.*`, `governance.establishment.*`, `governance.user_scope.*`, `governance.sharing.*`, `governance.consolidation.*`, `audit.read` | sem acesso a outro tenant |
| Gestor corporativo | acompanhar varias empresas e consolidar informacoes | `governance.company.read`, `governance.establishment.read`, `governance.context.switch`, `reporting.consolidated.read`, `consolidation.run.read` | sem alterar estrutura, salvo delegacao |
| Gestor de empresa | operar e supervisionar uma empresa e seus estabelecimentos | `governance.company.read`, `governance.establishment.read`, `governance.context.switch`, escopos dos modulos | sem acesso a empresas nao vinculadas |
| Gestor de filial | operar filial especifica | `governance.establishment.read`, `governance.context.switch`, escopos operacionais | sem alterar estrutura juridica |
| Operador | executar processos transacionais no contexto ativo | `governance.context.switch` e permissoes do modulo | sem manutencao estrutural |
| Auditor | consultar trilhas e consolidacoes | `audit.read`, `reporting.consolidated.read`, `consolidation.run.read` | sem alterar registros |
| Usuario de integracao/API | integrar dados no escopo autorizado | `integration.run`, `integration.read`, escopos especificos | sem uso administrativo amplo |

### Permissoes sugeridas

- `governance.company.read`
- `governance.company.create`
- `governance.company.update`
- `governance.company.activate`
- `governance.company.inactivate`
- `governance.company.archive`
- `governance.establishment.read`
- `governance.establishment.create`
- `governance.establishment.update`
- `governance.establishment.activate`
- `governance.establishment.inactivate`
- `governance.establishment.archive`
- `governance.user_scope.manage`
- `governance.context.switch`
- `governance.sharing.policy.manage`
- `governance.consolidation.run`
- `governance.consolidation.adjust`
- `reporting.consolidated.read`
- `audit.read`
- `intercompany.manage`

## 9. Regras de negocio

### RN-001 - Isolamento por tenant

- **Descricao:** todo registro da funcionalidade pertence a um unico tenant.
- **Motivo da regra:** impedir vazamento entre clientes.
- **Origem:** planilha, benchmark e boa pratica.
- **Condicao:** qualquer leitura, escrita ou consolidacao.
- **Acao do sistema:** filtrar e autorizar por `tenantId`.
- **Resultado esperado:** nenhum dado de outro tenant e exposto ou alterado.
- **Excecoes:** nenhuma.
- **Perfis impactados:** todos.
- **Campos impactados:** `tenantId`.
- **Mensagens relacionadas:** acesso negado.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-002 - Empresa e entidade legal sao equivalentes no modelo funcional

- **Descricao:** no EixoOne, `empresa` representa a entidade legal/contabil principal.
- **Motivo da regra:** evitar confusao com filial ou unidade operacional.
- **Origem:** pesquisa externa.
- **Condicao:** cadastro ou uso de empresa.
- **Acao do sistema:** tratar empresa como nodo juridico-contabil principal.
- **Resultado esperado:** regras de consolidacao, contabilizacao e autorizacao se ancoram na empresa.
- **Excecoes:** nenhuma.
- **Perfis impactados:** administradores, gestores, auditores.
- **Campos impactados:** `companyId`, `regimeTributario`, `legalNatureCode`.
- **Mensagens relacionadas:** validacoes de estrutura.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-003 - Matriz e filial sao estabelecimentos

- **Descricao:** matriz e filial sao tipos de estabelecimento de uma empresa.
- **Motivo da regra:** alinhar modelo ao cadastro e a pratica brasileira.
- **Origem:** Receita Federal e benchmark ERP.
- **Condicao:** criacao ou alteracao de estabelecimento.
- **Acao do sistema:** exigir `establishmentType`.
- **Resultado esperado:** modelo organizacional consistente.
- **Excecoes:** nenhuma.
- **Perfis impactados:** administradores.
- **Campos impactados:** `establishmentType`, `companyId`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-004 - Uma empresa possui uma unica matriz principal ativa

- **Descricao:** deve existir exatamente uma matriz principal por empresa em estado ativo.
- **Motivo da regra:** garantir hierarquia e referencia principal.
- **Origem:** inferencia controlada + pratica de mercado.
- **Condicao:** ativacao, inativacao ou criacao da matriz.
- **Acao do sistema:** bloquear multiplas matrizes principais ativas.
- **Resultado esperado:** uma referencia principal por empresa.
- **Excecoes:** empresa em configuracao inicial pode ainda nao ter sido ativada.
- **Perfis impactados:** administradores.
- **Campos impactados:** `isPrincipal`, `establishmentType`, `status`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-005 - O sistema nao pode inferir matriz/filial so pelo CNPJ

- **Descricao:** o tipo do estabelecimento deve ser explicitamente armazenado.
- **Motivo da regra:** o sufixo `0001` nao e identificador definitivo de matriz.
- **Origem:** Receita Federal.
- **Condicao:** leitura, importacao ou sincronizacao cadastral.
- **Acao do sistema:** usar campo explicito de tipo e nao heuristica de sufixo.
- **Resultado esperado:** classificacao correta em cenarios atuais e futuros.
- **Excecoes:** nenhuma.
- **Perfis impactados:** todos.
- **Campos impactados:** `cnpj`, `establishmentType`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-006 - Escrita exige contexto operacional unico

- **Descricao:** toda operacao de gravacao deve ocorrer em uma empresa ativa e, quando aplicavel, em um estabelecimento ativo.
- **Motivo da regra:** evitar inconsistencias cross-company.
- **Origem:** planilha, Odoo e NetSuite.
- **Condicao:** create, update, approve, cancel, post, close, transfer.
- **Acao do sistema:** bloquear operacao sem contexto valido.
- **Resultado esperado:** gravacao sempre ancorada em escopo unico.
- **Excecoes:** cadastros verdadeiramente globais do tenant.
- **Perfis impactados:** todos os perfis operacionais.
- **Campos impactados:** `activeCompanyId`, `activeEstablishmentId`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-007 - Leitura consolidada pode usar varios escopos autorizados

- **Descricao:** o usuario pode consultar dados de varias empresas e estabelecimentos autorizados na mesma sessao.
- **Motivo da regra:** suportar consolidacao e analise corporativa.
- **Origem:** NetSuite, Odoo, Business Central.
- **Condicao:** dashboards, relatorios, buscas e consultas.
- **Acao do sistema:** permitir multi-selecao de escopo para leitura.
- **Resultado esperado:** visao consolidada sem abrir escrita indevida.
- **Excecoes:** nenhuma.
- **Perfis impactados:** gestores e auditores.
- **Campos impactados:** `selectedReadScopes`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-008 - Permissoes efetivas devem ser recalculadas a cada troca de contexto

- **Descricao:** mudar empresa ou estabelecimento ativo deve recarregar grants e restricoes.
- **Motivo da regra:** evitar heranca indevida de permissao.
- **Origem:** planilha e boa pratica.
- **Condicao:** troca de contexto.
- **Acao do sistema:** recomputar permissoes efetivas.
- **Resultado esperado:** UI e backend refletem o novo escopo.
- **Excecoes:** nenhuma.
- **Perfis impactados:** todos.
- **Campos impactados:** sessao de usuario.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-009 - Compartilhamento entre empresas depende de politica explicita

- **Descricao:** nenhum dado e global ou cross-company por padrao.
- **Motivo da regra:** default deny para compartilhamento.
- **Origem:** Dynamics e Odoo.
- **Condicao:** modelagem de cadastros compartilhaveis.
- **Acao do sistema:** exigir `scopeType` e `shareMode`.
- **Resultado esperado:** compartilhamento governado e auditavel.
- **Excecoes:** dados tecnicos globais do tenant.
- **Perfis impactados:** administradores.
- **Campos impactados:** `scopeType`, `shareMode`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-010 - Consolidacao deve ser completa e total

- **Descricao:** a funcionalidade deve suportar consolidacao organizacional, operacional, financeira, contabil e intercompany.
- **Motivo da regra:** decisao explicita do solicitante.
- **Origem:** solicitacao atual e benchmark.
- **Condicao:** execucao de consolidacao ou consulta consolidada.
- **Acao do sistema:** consolidar segundo regras parametrizadas, escopo autorizado, moeda, percentuais e eliminacoes.
- **Resultado esperado:** visao corporativa total e rastreavel.
- **Excecoes:** nenhuma conceitual; implementacao pode ser faseada.
- **Perfis impactados:** gestores corporativos, controladoria, auditoria.
- **Campos impactados:** parametros de consolidacao.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-011 - Intercompany e fluxo explicito

- **Descricao:** transacoes entre empresas nao devem ocorrer por mistura de contexto, mas por fluxo intercompany proprio.
- **Motivo da regra:** garantir integridade, conciliacao e eliminacao.
- **Origem:** Business Central e NetSuite.
- **Condicao:** operacoes entre empresas do mesmo tenant.
- **Acao do sistema:** exigir parceiros, mapeamentos e reconciliacao.
- **Resultado esperado:** intercompany controlado e auditavel.
- **Excecoes:** nenhuma.
- **Perfis impactados:** financeiro, controladoria, admins.
- **Campos impactados:** parceiros, mapeamentos, status intercompany.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-012 - VInculos relacionais devem respeitar o mesmo escopo

- **Descricao:** registros relacionais nao podem cruzar empresa/estabelecimento de modo inconsistente.
- **Motivo da regra:** consistencia de estados.
- **Origem:** Odoo guidelines, planilha.
- **Condicao:** gravacao de qualquer registro dependente.
- **Acao do sistema:** validar empresa e estabelecimento de todas as referencias.
- **Resultado esperado:** um documento de uma empresa nao aponta para filial de outra, salvo fluxo intercompany explicito.
- **Excecoes:** intercompany modelado.
- **Perfis impactados:** todos.
- **Campos impactados:** chaves de escopo em tabelas dependentes.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-013 - Regime tributario pertence a empresa

- **Descricao:** o regime tributario e definido no nivel da empresa/entidade legal.
- **Motivo da regra:** coerencia juridico-tributaria.
- **Origem:** fontes oficiais brasileiras.
- **Condicao:** cadastro da empresa.
- **Acao do sistema:** exigir campo explicito.
- **Resultado esperado:** empresa com regime claro para processos fiscais e financeiros.
- **Excecoes:** parametrizacoes locais no nivel estabelecimento nao substituem o regime da empresa.
- **Perfis impactados:** administradores e fiscal.
- **Campos impactados:** `regimeTributario`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-014 - CNAE deve refletir a atividade do estabelecimento

- **Descricao:** o CNAE do estabelecimento deve refletir as atividades realmente exercidas por ele.
- **Motivo da regra:** aderencia a orientacao oficial.
- **Origem:** Receita Federal.
- **Condicao:** cadastro ou alteracao de estabelecimento.
- **Acao do sistema:** validar presenca e consistencia dos CNAEs.
- **Resultado esperado:** cadastro mais aderente ao registro oficial.
- **Excecoes:** cenarios internacionais sem CNAE podem usar classificador equivalente.
- **Perfis impactados:** administradores.
- **Campos impactados:** `cnaePrincipal`, `cnaesSecundarios`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-015 - Exclusao fisica nao e permitida para estrutura com historico

- **Descricao:** empresa e estabelecimento com historico operacional nao podem ser removidos fisicamente.
- **Motivo da regra:** auditoria e rastreabilidade.
- **Origem:** boa pratica.
- **Condicao:** tentativa de exclusao.
- **Acao do sistema:** bloquear e oferecer inativacao/arquivamento.
- **Resultado esperado:** preservacao do historico.
- **Excecoes:** ambiente de homologacao controlado.
- **Perfis impactados:** administradores.
- **Campos impactados:** `status`, `archivedAt`.
- **Prioridade:** Alta.
- **Status:** Confirmada.

### RN-016 - Toda acao critica deve gerar auditoria estruturada

- **Descricao:** criar, editar, ativar, inativar, arquivar, trocar contexto, vincular acesso e executar consolidacao deve gerar auditoria.
- **Motivo da regra:** governanca.
- **Origem:** planilha e OWASP Logging.
- **Condicao:** acao critica.
- **Acao do sistema:** registrar ator, alvo, escopo, before/after, resultado e correlationId.
- **Resultado esperado:** trilha completa e confiavel.
- **Excecoes:** nenhuma.
- **Perfis impactados:** todos.
- **Campos impactados:** metadados de auditoria.
- **Prioridade:** Alta.
- **Status:** Confirmada.

## 10. Campos e validacoes

### 10.1 Empresa / entidade legal

| Campo | Nome tecnico sugerido | Tipo de dado | Obrigatorio | Valor padrao | Tamanho | Mascara | Validacao | Mensagem de erro | Observacoes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tenant | `tenantId` | UUID/ULID | Sim | contexto autenticado | 26-36 | - | deve existir no token | Tenant invalido | imutavel |
| Empresa | `companyId` | UUID/ULID | Sim | backend | 26-36 | - | unico | Empresa invalida | imutavel |
| Razao social | `legalName` | string | Sim | - | 2-150 | - | texto limpo e nao vazio | Informe a razao social | auditavel |
| Nome fantasia | `tradeName` | string | Nao | - | 2-150 | - | sanitizacao | Nome fantasia invalido | opcional |
| Raiz cadastral | `companyRootRegistration` | string | Sim | - | 8-12+ | parametrizavel | formato conforme pais | Identificador raiz invalido | no Brasil deriva do CNPJ |
| Natureza juridica | `legalNatureCode` | string | Sim | - | parametrizavel | - | codigo valido | Natureza juridica invalida | tabela externa |
| Pais | `countryCode` | string | Sim | `BR` | 2-3 | ISO | codigo permitido | Pais invalido | internacionalizavel |
| Data de abertura | `openingDate` | data | Sim | - | - | - | data valida | Data de abertura invalida | |
| Regime tributario | `regimeTributario` | enum | Sim | - | - | - | valor permitido | Regime tributario invalido | empresa, nao filial |
| Moeda funcional | `defaultCurrency` | string | Sim | - | 3 | ISO 4217 | moeda permitida | Moeda invalida | |
| Calendario fiscal | `fiscalCalendarId` | UUID/string | Sim | - | - | - | calendario existente | Calendario fiscal invalido | |
| Modo de consolidacao | `consolidationMode` | enum | Sim | `FULL` | - | - | `NONE`, `PARTIAL`, `FULL` | Modo de consolidacao invalido | |
| Status | `companyStatus` | enum | Sim | `EM_CONFIGURACAO` | - | - | maquina de estados | Status invalido | |
| Versao | `version` | integer/string | Sim | `1` | - | - | concorrencia otimista | Registro desatualizado | |
| Criado em | `createdAt` | timestamp | Sim | servidor | - | - | gerado no backend | - | auditoria |
| Criado por | `createdBy` | UUID | Sim | token | - | - | usuario valido | - | auditoria |
| Atualizado em | `updatedAt` | timestamp | Sim | servidor | - | - | gerado no backend | - | auditoria |
| Atualizado por | `updatedBy` | UUID | Sim | token | - | - | usuario valido | - | auditoria |

### 10.2 Estabelecimento (matriz ou filial)

| Campo | Nome tecnico sugerido | Tipo de dado | Obrigatorio | Valor padrao | Tamanho | Mascara | Validacao | Mensagem de erro | Observacoes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Estabelecimento | `establishmentId` | UUID/ULID | Sim | backend | 26-36 | - | unico | Estabelecimento invalido | |
| Empresa vinculada | `companyId` | UUID/ULID | Sim | - | 26-36 | - | empresa existente do mesmo tenant | Empresa invalida | |
| Tipo do estabelecimento | `establishmentType` | enum | Sim | - | - | - | `MATRIZ`, `FILIAL` | Tipo invalido | explicito |
| Indicador principal | `isPrincipal` | boolean | Sim | `false` | - | - | so uma matriz principal ativa | Configuracao principal invalida | |
| CNPJ | `cnpj` | string | Sim no Brasil | - | 14 caracteres de mascara | `XX.XXX.XXX/XXXX-DV` | formato numerico ou alfanumerico permitido | CNPJ invalido | nao inferir tipo por sufixo |
| Raiz do CNPJ | `cnpjRoot` | string | Sim | derivado | 8 | - | deve casar com a empresa | Raiz do CNPJ inconsistente | |
| Ordem do estabelecimento | `establishmentOrder` | string | Sim | derivado | 4 | - | valor valido | Ordem do estabelecimento invalida | pode ser alfanumerica |
| Nome empresarial exibivel | `legalNameAtEstablishment` | string | Sim | - | 2-150 | - | nao vazio | Nome invalido | |
| Nome fantasia local | `tradeNameAtEstablishment` | string | Nao | - | 2-150 | - | sanitizacao | Nome fantasia invalido | |
| CNAE principal | `cnaePrincipal` | string | Sim | - | 7-10 | tabela | codigo valido | CNAE principal invalido | |
| CNAEs secundarios | `cnaesSecundarios` | lista | Nao | vazio | parametrizavel | - | sem duplicidade | CNAEs secundarios invalidos | |
| Endereco | `address` | objeto | Sim | - | - | - | campos minimos por pais | Endereco invalido | |
| CEP/Codigo postal | `postalCode` | string | Condicional | - | parametrizavel | por pais | formato valido | CEP invalido | |
| UF/Estado | `stateCode` | string | Condicional | - | 2+ | por pais | valido na jurisdicao | UF invalida | |
| Municipio | `cityCode` | string | Condicional | - | parametrizavel | - | cidade valida | Municipio invalido | |
| Data de abertura | `openingDate` | data | Sim | - | - | - | data valida | Data de abertura invalida | |
| Status | `establishmentStatus` | enum | Sim | `EM_CONFIGURACAO` | - | - | maquina de estados | Status invalido | |
| Warehouse padrao | `defaultWarehouseId` | UUID | Nao | - | - | - | warehouse do mesmo escopo | Warehouse invalido | recomendado para operacao |
| Inscricoes locais | `localTaxRegistrations` | lista/objeto | Parametrizado | vazio | - | por tipo | conforme configuracao local | Inscricao local invalida | IE, IM etc. |
| Licencas locais | `localLicenses` | lista/objeto | Parametrizado | vazio | - | - | conforme orgao/atividade | Licenca invalida | |
| E-mail | `contactEmail` | string | Recomendado | - | 254 | email | formato valido | E-mail invalido | |
| Telefone | `contactPhone` | string | Recomendado | - | parametrizavel | por pais | formato valido | Telefone invalido | |
| Versao | `version` | integer/string | Sim | `1` | - | - | concorrencia otimista | Registro desatualizado | |

### 10.3 Contexto operacional e autorizacao

| Campo | Nome tecnico sugerido | Tipo de dado | Obrigatorio | Validacao | Observacoes |
| --- | --- | --- | --- | --- | --- |
| Empresa ativa | `activeCompanyId` | UUID | Sim para escrita | deve estar no escopo do usuario | contexto unico |
| Estabelecimento ativo | `activeEstablishmentId` | UUID | Condicional | deve pertencer a empresa ativa | contexto unico |
| Empresas de leitura | `selectedReadCompanyIds` | lista UUID | Nao | subset do escopo autorizado | consulta consolidada |
| Estabelecimentos de leitura | `selectedReadEstablishmentIds` | lista UUID | Nao | subset do escopo autorizado | consulta consolidada |
| Empresas autorizadas | `allowedCompanyIds` | lista UUID | Sim | mesmo tenant | |
| Estabelecimentos autorizados | `allowedEstablishmentIds` | lista UUID | Nao | pertencem as empresas autorizadas | |
| Empresa padrao | `defaultCompanyId` | UUID | Nao | deve ser autorizada | |
| Estabelecimento padrao | `defaultEstablishmentId` | UUID | Nao | deve ser autorizado | |

### 10.4 Escopo e compartilhamento

| Campo | Nome tecnico sugerido | Tipo de dado | Obrigatorio | Valores | Observacoes |
| --- | --- | --- | --- | --- | --- |
| Tipo de escopo | `scopeType` | enum | Sim nos dados compartilhaveis | `GLOBAL`, `COMPANY`, `ESTABLISHMENT` | define a quem pertence o dado |
| Modo de compartilhamento | `shareMode` | enum | Sim quando aplicavel | `NONE`, `SINGLE_MASTER`, `REPLICATED` | define como e compartilhado |
| Empresa mestre | `masterCompanyId` | UUID | Condicional | empresa valida | usado em `SINGLE_MASTER` |
| Politica de compartilhamento | `sharingPolicyId` | UUID | Condicional | politica existente | governanca |

## 11. Estados e transicoes

### 11.1 Empresa

| Estado atual | Acao | Proximo estado | Quem pode executar | Condicoes | Auditoria obrigatoria |
| --- | --- | --- | --- | --- | --- |
| Em configuracao | Completar cadastro | Ativa | Administrador | campos minimos validos | Sim |
| Ativa | Inativar | Inativa | Administrador | sem bloqueio critico pendente | Sim |
| Inativa | Reativar | Ativa | Administrador | dados ainda validos | Sim |
| Inativa | Arquivar | Arquivada | Administrador | sem uso operacional futuro | Sim |
| Arquivada | Reabrir | Inativa | Administrador | justificativa obrigatoria | Sim |

### 11.2 Estabelecimento

| Estado atual | Acao | Proximo estado | Quem pode executar | Condicoes | Auditoria obrigatoria |
| --- | --- | --- | --- | --- | --- |
| Em configuracao | Completar cadastro | Ativo | Administrador | campos obrigatorios validos | Sim |
| Ativo | Inativar | Inativo | Administrador | sem bloqueio regulatorio/operacional | Sim |
| Inativo | Reativar | Ativo | Administrador | dados ainda validos | Sim |
| Inativo | Arquivar | Arquivado | Administrador | sem dependencia operacional aberta | Sim |
| Arquivado | Reabrir | Inativo | Administrador | justificativa obrigatoria | Sim |

### Estados possiveis

1. Em configuracao
2. Ativo
3. Inativo
4. Arquivado

### Transicoes proibidas

1. Arquivar diretamente uma empresa ou estabelecimento ativo.
2. Reativar registro arquivado sem passar por reabertura controlada.
3. Remover fisicamente registro com historico.

## 12. Fluxo do sistema

### Fluxo principal

1. Usuario autentica no tenant.
2. Sistema carrega escopos autorizados.
3. Sistema restaura ou solicita contexto operacional.
4. Usuario entra em `Multiempresa e multifilial`.
5. Sistema carrega empresas, estabelecimentos, escopos e indicadores.
6. Usuario consulta, cria ou altera a estrutura conforme permissao.
7. Sistema valida campos, relacoes, regime tributario, CNAE, escopo e consistencia.
8. Sistema grava os dados no escopo correto.
9. Sistema registra auditoria.
10. Sistema atualiza cache, contexto e visao da tela.
11. Sistema disponibiliza leitura consolidada e, quando aplicavel, consolidacao total.

### Fluxos alternativos

- usuario possui apenas uma empresa e um estabelecimento: contexto pode ser predefinido;
- usuario possui varias empresas para leitura: sistema permite multiselecionar filtros;
- usuario possui leitura consolidada, mas nao edicao cross-company: sistema permite abrir detalhes, mas bloqueia alteracao;
- matriz administrativa e filial operacional: sistema aceita e parametriza a operacao;
- licenca/regra regulatoria no nivel matriz: sistema trata como registro da empresa ou do estabelecimento principal, conforme configuracao.

### Fluxos de excecao

- tentativa de acessar empresa nao autorizada;
- tentativa de gravar em estabelecimento de outra empresa;
- tentativa de usar CNAE ou identificador invalido;
- tentativa de consolidar empresas sem mapeamentos obrigatorios;
- falha de auditoria ou persistencia: rollback completo;
- alteracao simultanea: conflito por versao/etag.

## 13. Fluxo do usuario

### Fluxo principal do usuario

1. Acessa o EixoOne.
2. Visualiza seu contexto atual.
3. Seleciona empresa e estabelecimento ativos, se necessario.
4. Acessa `Base e Governanca > Multiempresa e multifilial`.
5. Consulta a estrutura organizacional.
6. Cria ou ajusta empresa, matriz, filial ou escopo de acesso.
7. Salva.
8. Recebe confirmacao e visualiza o historico.

### Fluxo de consulta

1. Abrir listagem.
2. Filtrar por empresa, estabelecimento, status, tipo e regime.
3. Visualizar detalhes.
4. Abrir consolidado por selecao de escopos.

### Fluxo de criacao

1. Criar empresa.
2. Informar dados juridicos e tributarios.
3. Criar matriz principal.
4. Criar filiais, se houver.
5. Definir contexto e grants.
6. Salvar e ativar.

### Fluxo de edicao

1. Abrir empresa ou estabelecimento.
2. Editar campos permitidos.
3. Revisar impacto.
4. Confirmar gravacao.
5. Receber feedback.

### Fluxo de exclusao, inativacao ou arquivamento

1. Solicitar exclusao.
2. Sistema verifica dependencias.
3. Se houver historico, oferece inativacao/arquivamento em vez de exclusao.
4. Usuario informa justificativa.
5. Sistema grava alteracao e audita.

### Fluxo de consolidacao total

1. Usuario com permissao abre area de consolidacao.
2. Seleciona empresas, periodos, moedas, percentuais e regras.
3. Sistema valida mapeamentos e pendencias.
4. Executa pre-checagens e reconciliacoes.
5. Gera run de consolidacao.
6. Aplica ou apresenta eliminacoes conforme politica.
7. Exibe resultado com drill-down e trilha de origem.

## 14. Casos de uso

### UC-001 - Cadastrar empresa

- **Ator principal:** Administrador
- **Objetivo:** criar entidade legal da operacao
- **Pre-condicoes:** autenticado e com permissao
- **Gatilho:** acao `Nova empresa`
- **Fluxo principal:** informar dados juridicos e tributarios -> validar -> salvar
- **Fluxos alternativos:** CNPJ/raiz duplicada, regime invalido, empresa sem matriz definida
- **Pos-condicoes:** empresa criada em estado valido
- **Regras relacionadas:** RN-001, RN-002, RN-013, RN-016
- **Criterios de aceite relacionados:** AC-001, AC-002, AC-010

### UC-002 - Cadastrar matriz

- **Ator principal:** Administrador
- **Objetivo:** criar estabelecimento principal da empresa
- **Pre-condicoes:** empresa existente
- **Gatilho:** acao `Nova matriz`
- **Fluxo principal:** preencher cadastro -> validar -> salvar -> marcar principal
- **Fluxos alternativos:** segunda matriz principal ativa, CNAE invalido
- **Pos-condicoes:** empresa com matriz principal valida
- **Regras relacionadas:** RN-003, RN-004, RN-005, RN-014
- **Criterios de aceite relacionados:** AC-003, AC-004

### UC-003 - Cadastrar filial

- **Ator principal:** Administrador
- **Objetivo:** criar estabelecimento adicional da empresa
- **Pre-condicoes:** empresa existente
- **Gatilho:** acao `Nova filial`
- **Fluxo principal:** selecionar empresa -> preencher dados -> validar -> salvar
- **Fluxos alternativos:** empresa invalida, CNPJ duplicado, CNAE invalido
- **Pos-condicoes:** filial vinculada a empresa correta
- **Regras relacionadas:** RN-003, RN-012, RN-014
- **Criterios de aceite relacionados:** AC-005, AC-006

### UC-004 - Trocar contexto operacional

- **Ator principal:** Usuario autorizado
- **Objetivo:** operar no escopo correto
- **Pre-condicoes:** usuario com grants validos
- **Gatilho:** seletor de contexto
- **Fluxo principal:** escolher empresa/estabelecimento -> validar -> aplicar -> recalcular permissoes
- **Fluxos alternativos:** escopo removido, usuario sem acesso, empresa inativa
- **Pos-condicoes:** sessao atualizada
- **Regras relacionadas:** RN-006, RN-007, RN-008
- **Criterios de aceite relacionados:** AC-007, AC-008

### UC-005 - Vincular usuario a empresas e estabelecimentos

- **Ator principal:** Administrador
- **Objetivo:** definir o escopo de acesso do usuario
- **Pre-condicoes:** usuario e empresa existentes
- **Gatilho:** acao `Gerenciar acessos`
- **Fluxo principal:** selecionar usuario -> definir empresas -> definir estabelecimentos -> salvar
- **Fluxos alternativos:** estabelecimento fora da empresa concedida
- **Pos-condicoes:** grants atualizados
- **Regras relacionadas:** RN-008, RN-012, RN-016
- **Criterios de aceite relacionados:** AC-009, AC-010

### UC-006 - Executar consolidacao total

- **Ator principal:** Gestor corporativo / Controladoria
- **Objetivo:** consolidar informacoes de varias empresas
- **Pre-condicoes:** empresas elegiveis, mapeamentos e permissao
- **Gatilho:** acao `Executar consolidacao`
- **Fluxo principal:** selecionar escopos -> validar parametros -> executar consolidacao -> revisar resultado
- **Fluxos alternativos:** falta de mapeamento, diferenca de moeda, erro em eliminacao
- **Pos-condicoes:** run consolidada registrada
- **Regras relacionadas:** RN-010, RN-011, RN-016
- **Criterios de aceite relacionados:** AC-011, AC-012, AC-013

## 15. Mensagens do sistema

| Situacao | Mensagem sugerida | Tipo | Campo relacionado |
| --- | --- | --- | --- |
| Empresa criada | Empresa salva com sucesso. | Sucesso | formulario |
| Estabelecimento criado | Estabelecimento salvo com sucesso. | Sucesso | formulario |
| Contexto ausente | Selecione uma empresa e, quando necessario, um estabelecimento para continuar. | Erro | contexto |
| Acesso negado | Voce nao possui permissao para operar neste escopo. | Bloqueio | contexto |
| Tipo invalido | Defina explicitamente se o estabelecimento e matriz ou filial. | Erro | `establishmentType` |
| CNPJ invalido | Informe um CNPJ valido. | Erro | `cnpj` |
| CNPJ duplicado | Ja existe um estabelecimento com este identificador no tenant atual. | Erro | `cnpj` |
| CNAE invalido | Informe um CNAE compativel com as atividades exercidas neste estabelecimento. | Erro | `cnaePrincipal` |
| Regime invalido | Selecione um regime tributario valido para a empresa. | Erro | `regimeTributario` |
| Conflito de versao | Este registro foi alterado por outro usuario. Atualize a tela e tente novamente. | Erro | `version` |
| Arquivamento bloqueado | Este registro possui dependencias e nao pode ser excluido. Inative ou arquive conforme politica. | Alerta | status |
| Escopo alterado | Seu contexto operacional foi atualizado. | Informacao | contexto |
| Consolidacao iniciada | A consolidacao foi iniciada e esta sendo processada. | Informacao | consolidacao |
| Consolidacao concluida | Consolidacao concluida com sucesso. | Sucesso | consolidacao |
| Consolidacao com divergencia | A consolidacao foi concluida com divergencias que exigem revisao. | Alerta | consolidacao |

## 16. Requisitos funcionais

| Codigo | Requisito funcional | Prioridade | Origem |
| --- | --- | --- | --- |
| RF-001 | O sistema deve permitir cadastrar empresas com dados juridicos e tributarios obrigatorios. | Alta | Planilha + pesquisa |
| RF-002 | O sistema deve permitir cadastrar matriz e filiais como estabelecimentos da empresa. | Alta | Planilha + pesquisa |
| RF-003 | O sistema deve armazenar explicitamente o tipo de estabelecimento, sem inferencia apenas pelo CNPJ. | Alta | Pesquisa |
| RF-004 | O sistema deve permitir vincular usuarios a empresas e estabelecimentos especificos. | Alta | Planilha |
| RF-005 | O sistema deve exigir contexto unico ativo para operacoes de escrita. | Alta | Benchmark |
| RF-006 | O sistema deve permitir leitura consolidada em varios escopos autorizados. | Alta | Benchmark |
| RF-007 | O sistema deve recalcular grants e defaults a cada troca de contexto. | Alta | Benchmark |
| RF-008 | O sistema deve bloquear qualquer operacao fora do escopo autorizado. | Alta | Planilha |
| RF-009 | O sistema deve permitir politicas de compartilhamento por dominio usando escopo e modo de compartilhamento. | Alta | Pesquisa |
| RF-010 | O sistema deve permitir consolidacao completa e total entre empresas elegiveis. | Alta | Solicitacao atual |
| RF-011 | O sistema deve suportar processo intercompany explicito entre empresas. | Alta | Pesquisa |
| RF-012 | O sistema deve registrar auditoria de todas as acoes criticas da funcionalidade. | Alta | Planilha |
| RF-013 | O sistema deve impedir exclusao fisica de empresa ou estabelecimento com historico. | Alta | Boa pratica |
| RF-014 | O sistema deve suportar parametrizacao de licencas, inscricoes locais e validacoes regulatorias. | Media | Pesquisa |

## 17. Requisitos nao funcionais

| Codigo | Requisito nao funcional | Categoria | Prioridade |
| --- | --- | --- | --- |
| RNF-001 | O sistema deve aplicar segregacao forte por tenant, empresa e estabelecimento. | Seguranca | Alta |
| RNF-002 | O sistema deve adotar autorizacao server-side com default deny. | Seguranca | Alta |
| RNF-003 | O sistema deve suportar CNPJ numerico e alfanumerico sem quebra funcional. | Compatibilidade | Alta |
| RNF-004 | O sistema deve manter consistencia relacional entre registros do mesmo escopo. | Confiabilidade | Alta |
| RNF-005 | O sistema deve suportar consolidacao total com rastreabilidade de origem. | Confiabilidade | Alta |
| RNF-006 | O sistema deve registrar trilha de auditoria estruturada e mascarar dados sensiveis em logs. | Auditoria | Alta |
| RNF-007 | O sistema deve oferecer boa performance em consultas consolidadas por meio de filtros, paginação e processamento assíncrono quando aplicável. | Performance | Alta |
| RNF-008 | O sistema deve ser parametrizavel para cenarios fiscais e regulatorios variaveis. | Manutenibilidade | Alta |
| RNF-009 | O sistema deve exibir o contexto ativo de forma clara para reduzir erro do usuario. | Usabilidade | Alta |
| RNF-010 | O sistema deve permitir evolucao para multiplos paises e classificacoes cadastrais. | Escalabilidade | Media |

## 18. Criterios de aceite

| ID | Cenario | Tipo | Dado que | Quando | Entao | Regra relacionada |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 | Criar empresa valida | Positivo | admin autenticado | cadastra empresa com dados validos | empresa e salva sem gravacao parcial | RN-001, RN-002, RN-013 |
| AC-002 | Bloquear regime invalido | Validacao | empresa em cadastro | informa regime nao permitido | sistema rejeita e informa erro | RN-013 |
| AC-003 | Criar matriz principal | Positivo | empresa existente | cadastra matriz valida | empresa passa a ter matriz principal ativa | RN-003, RN-004 |
| AC-004 | Bloquear segunda matriz principal | Negativo | empresa ja possui matriz principal ativa | tenta criar outra principal | sistema bloqueia | RN-004 |
| AC-005 | Criar filial valida | Positivo | empresa existente | cadastra filial valida | filial fica vinculada corretamente | RN-003, RN-012 |
| AC-006 | Bloquear filial fora da empresa | Negativo | empresa A selecionada | tenta gravar filial vinculada a empresa B | sistema rejeita | RN-012 |
| AC-007 | Trocar contexto autorizado | Positivo | usuario com varios escopos | seleciona empresa/estabelecimento permitido | sessao e atualizada | RN-006, RN-008 |
| AC-008 | Bloquear troca nao autorizada | Permissao | usuario sem grant no escopo | tenta ativar contexto | sistema retorna bloqueio | RN-006 |
| AC-009 | Vincular usuario a escopos validos | Positivo | admin com permissao | define grants coerentes | grants sao persistidos | RN-008 |
| AC-010 | Bloquear grant inconsistente | Validacao | admin escolheu empresa A | tenta conceder estabelecimento de empresa B | sistema rejeita | RN-012 |
| AC-011 | Executar consolidacao total valida | Positivo | parametros e mapeamentos completos | executa consolidacao | resultado consolidado e gerado e auditado | RN-010, RN-016 |
| AC-012 | Bloquear consolidacao com mapeamento pendente | Integracao | empresa sem mapeamento obrigatorio | executa consolidacao | sistema bloqueia ou marca run com erro controlado | RN-010, RN-011 |
| AC-013 | Auditoria obrigatoria | Auditoria | qualquer acao critica | conclui a acao | evento auditavel e registrado | RN-016 |
| AC-014 | Nao inferir matriz apenas por `0001` | Borda | estabelecimento com sufixo `0001` nao principal ou futuro cnpj alfanumerico | sistema carrega o cadastro | tipo exibido segue campo explicito e nao heuristica | RN-005 |

## 19. Casos de borda

| Caso de borda | Risco | Comportamento esperado |
| --- | --- | --- |
| CNPJ alfanumerico de nova filial | classificacao incorreta | sistema aceita e classifica pelo campo de tipo |
| Matriz apenas administrativa | erro de bloqueio operacional | sistema permite e direciona operacao para filiais |
| Licenca da matriz extensiva a filial | bloqueio regulatorio indevido | sistema permite configuracao de extensao por politica |
| Usuario com leitura em varias empresas e escrita em uma | confusao operacional | tela diferencia leitura consolidada de contexto ativo |
| Empresas com moedas diferentes em consolidacao | valor consolidado inconsistente | sistema exige taxa e regra de conversao |
| Empresas com calendario fiscal diferente | agregacao errada | sistema exige parametro de consolidacao |
| Documento apontando para estabelecimento de outra empresa | vazamento/inconsistencia | sistema bloqueia salvo fluxo intercompany explicito |
| Mudanca de permissao durante a sessao | uso indevido de escopo removido | sessao e invalidada/recarregada |
| Exclusao de empresa com historico | perda de rastreabilidade | exclusao fisica bloqueada |
| Compartilhamento indevido de dado fiscal | exposicao e erro legal | dado fiscal nunca e global por padrao |

## 20. Auditoria e rastreabilidade

| Evento | Quando auditar | Dados minimos registrados | Sensibilidade |
| --- | --- | --- | --- |
| Criacao de empresa | ao salvar nova empresa | tenant, empresa, ator, timestamp, correlationId | Alta |
| Alteracao de empresa | ao editar dados | before/after, ator, escopo | Alta |
| Criacao de matriz/filial | ao salvar estabelecimento | empresa, estabelecimento, tipo, ator | Alta |
| Alteracao de escopo de usuario | ao salvar grants | usuario alvo, grants antes/depois, ator | Alta |
| Troca de contexto | ao mudar empresa/estabelecimento ativo | usuario, contexto anterior, novo contexto, canal | Media |
| Ativacao/inativacao/arquivamento | ao mudar estado | estado anterior, novo estado, justificativa | Alta |
| Tentativa negada | ao ocorrer bloqueio de acesso | usuario, alvo, escopo solicitado, motivo | Alta |
| Execucao de consolidacao | ao iniciar/finalizar run | parametros, empresas, periodo, resultado, actor | Alta |
| Ajustes/eliminacoes | ao registrar ajuste | conta, valor, justificativa, empresa, actor | Alta |
| Alteracao de politica de compartilhamento | ao editar politica | politica, before/after, actor | Alta |

## 21. MVP e evolucao futura

### Escopo MVP

- cadastro de empresa;
- cadastro de matriz e filiais;
- grants de acesso por empresa/estabelecimento;
- contexto unico de escrita;
- leitura consolidada multiempresa;
- politica basica de escopo e compartilhamento;
- auditoria estrutural;
- consolidacao inicial preparada para evolucao completa.

### Fora do MVP

- todas as automatizacoes intercompany completas;
- todas as eliminacoes automaticas complexas;
- cobertura regulatoria detalhada por setor;
- consolidacao internacional total com todos os cenarios de moeda e calendario.

### Evolucoes futuras

| Item | MVP | Justificativa | Versao sugerida |
| --- | --- | --- | --- |
| Empresa, matriz e filial | Sim | fundacao obrigatoria | V1 |
| Grants por escopo | Sim | seguranca base | V1 |
| Contexto unico de escrita | Sim | consistencia | V1 |
| Leitura consolidada | Sim | valor gerencial imediato | V1 |
| Politica de compartilhamento por dominio | Sim | governanca | V1 |
| Run formal de consolidacao | Sim | requisito do patrocinador | V1/V1.1 |
| Eliminacoes avancadas | Nao completo | alta complexidade | V2 |
| Intercompany automatico completo | Nao completo | depende de modulos financeiros/estoque | V2 |
| Parametrizacao regulatoria ampliada | Nao completa | exige discovery por setor | V2/V3 |
| Multi-pais aprofundado | Nao | maturidade posterior | V3 |

## 22. Riscos e pendencias

1. Validar com fiscal/contabilidade as inscricoes locais obrigatorias por UF, municipio e setor.
2. Definir se `GrupoEconomico` sera entidade de primeira classe desde V1.
3. Definir com controladoria as regras finais de eliminacao, percentual de consolidacao e mapeamento de contas.
4. Confirmar se `MEI` entra ja no release inicial com todo o comportamento fiscal/operacional ou se sera suportado com escopo reduzido.
5. Validar se unidades operacionais ficam abaixo do estabelecimento ou podem existir diretamente abaixo da empresa em alguns dominios.

## 23. Matriz de rastreabilidade

| Item da planilha | Regra de negocio | Campo/validacao | Fluxo | Criterio de aceite | Fonte |
| --- | --- | --- | --- | --- | --- |
| Cadastrar matriz e filiais | RN-003, RN-004, RN-005 | `establishmentType`, `cnpj`, `cnaePrincipal`, `companyId` | criacao estrutural | AC-003, AC-004, AC-005 | Receita, SAP |
| Definir empresa ativa | RN-006, RN-008 | `activeCompanyId`, `activeEstablishmentId` | troca de contexto | AC-007, AC-008 | NetSuite, Odoo |
| Vincular usuarios e operacao a filial | RN-008, RN-012 | grants e chaves de escopo | gestao de acesso e operacao | AC-009, AC-010 | Planilha, benchmark |
| Consolidar relatorios | RN-007, RN-010 | filtros, parametros, moedas, percentuais | consolidacao total | AC-011, AC-012 | Business Central, NetSuite |
| Bloquear acesso indevido entre empresas | RN-001, RN-006, RN-012 | `tenantId`, grants, escopo | todos os fluxos | AC-008, AC-013 | OWASP, planilha |
| Tratar regime tributario | RN-013 | `regimeTributario` | cadastro da empresa | AC-001, AC-002 | Simples Nacional, gov.br |
| Tratar CNAE por estabelecimento | RN-014 | `cnaePrincipal`, `cnaesSecundarios` | cadastro de estabelecimento | AC-005 | Receita Federal |

## 24. Conclusao

A definicao funcional final recomendada para `FG-001` no EixoOne e:

- `empresa` = entidade legal;
- `matriz` e `filial` = estabelecimentos da empresa;
- `unidade operacional` = nivel operacional abaixo da estrutura juridica;
- leitura multiempresa = permitida por escopo autorizado;
- escrita = contexto unico ativo e auditado;
- compartilhamento = politica explicita por dominio;
- consolidacao = completa e total, com suporte a intercompany, mapeamento, moeda, calendario, eliminacao e rastreabilidade.

Essa modelagem e a mais aderente ao que aparece de forma recorrente nos ERPs de referencia e ao que as fontes oficiais brasileiras sustentam para o contexto de cadastro e governanca empresarial.
