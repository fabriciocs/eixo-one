# Especificacao UX/UI - FG-001 Multiempresa e Multifilial

## Documentos relacionados

- [FG-001-multiempresa-multifilial.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-multiempresa-multifilial.md)
- [FG-001-backlog.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-backlog.md)
- [FG-001-execution-plan.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-execution-plan.md)

## 1. Resumo da funcionalidade

`FG-001 - Multiempresa e multifilial` define a experiencia de governanca organizacional do EixoOne para operacao de multiplas empresas, matriz, filiais e escopos autorizados dentro do mesmo tenant.

A experiencia precisa deixar claro:

- onde o usuario esta lendo;
- onde o usuario esta gravando;
- o que ele pode administrar;
- o que ele pode apenas consultar;
- quando esta em cadastro estrutural versus consolidacao corporativa.

Esta especificacao preserva as regras funcionais existentes e detalha como elas devem aparecer na interface, sem alterar logica de negocio.

## 2. Diagnostico UX/UI

### Funcionalidade analisada

- Nome: `FG-001 - Multiempresa e multifilial`
- Modulo: `Base e Governanca`
- Objetivo: permitir operar multiplas empresas e estabelecimentos com segregacao, grants, leitura consolidada e contexto unico de escrita
- Usuarios principais: administrador da plataforma, gestor corporativo, gestor de empresa, gestor de filial, operador, auditor e controladoria
- Acoes principais: cadastrar empresa, cadastrar matriz/filial, trocar contexto, gerenciar grants, consultar dados consolidados e executar consolidacao
- Telas esperadas: seletor de contexto, visao geral organizacional, lista/detalhe de empresas, cadastro/edicao de empresa, cadastro/edicao de estabelecimento, grants, leitura consolidada, consolidacao e historico
- Complexidade de UX: Muito alta
- Riscos principais: confusao entre leitura e escrita, concessao indevida de acesso, ambiguidade estrutural e consolidacao sem parametros claros

### Lacunas e suposicoes de UX/UI

| Lacuna | Impacto na UX/UI | Gravidade | Suposicao ou pendencia |
| --- | --- | --- | --- |
| Posicao final de `unidade operacional` ainda nao esta fechada | afeta navegacao, breadcrumb e formularios | Alta | manter fora da navegacao principal do V1 e preparar extensibilidade |
| `GrupoEconomico` nao esta confirmado como entidade visivel do V1 | afeta arquitetura da informacao e filtros corporativos | Media | nao tratar como etapa obrigatoria no fluxo principal |
| Consolidacao completa existe no funcional, mas backlog e execucao fatiam partes avancadas | afeta profundidade da UX de consolidacao | Alta | desenhar fluxo formal com espaco para evolucao, sem prometer automacoes avancadas no V1 |
| Parametros finais de moeda, percentual, calendario e eliminacao nao estao fechados | afeta formularios e revisao de run | Alta | exigir tela de revisao e bloqueio por pendencia |
| Escopo inicial de `MEI` nao esta confirmado | afeta opcoes e mensagens de regime | Media | manter suporte parametrico e adiar textos especificos |
| Regras detalhadas de inscricoes e licencas locais nao estao fechadas | afeta campos condicionais | Alta | tratar como secao parametrizada e expansivel |
| Matriz de compartilhamento por dominio ainda nao esta fechada | afeta areas avancadas de governanca | Media | exibir `scopeType` e `shareMode` como configuracoes avancadas |

### Divergencias entre os documentos e interpretacao adotada

| Divergencia | Documento principal | Documento complementar | Interpretacao UX segura |
| --- | --- | --- | --- |
| Consolidacao total aparece como requisito forte desde a base funcional | funcional | backlog e plano a fatiam em fases 3 e 4 | UX prepara area propria de consolidacao no V1, mas destaca estados de indisponibilidade parcial para capacidades avancadas |
| `Unidade operacional` existe no backlog, mas ainda esta pendente no funcional | backlog | funcional | UX nao usa unidade operacional como elemento central da navegacao inicial |
| Politica de compartilhamento aparece como fundamental no funcional, mas como disciplina futura no backlog | funcional | backlog e plano | UX deixa a configuracao avancada isolada de fluxos operacionais principais |

## 3. Objetivos de UX

| Objetivo de UX | Justificativa | Como sera atendido |
| --- | --- | --- |
| Tornar o contexto operacional inequívoco | reduz gravacao no escopo errado | cabecalho persistente com empresa e estabelecimento ativos |
| Separar leitura de escrita com clareza | o sistema permite leitura multiempresa, mas escrita com contexto unico | areas e labels distintas para leitura e escrita |
| Reduzir esforco em tarefas recorrentes | usuarios frequentes trocam contexto e consultam muito | defaults, filtros persistentes e atalhos de contexto |
| Prevenir erro de grants | grants inconsistentes geram risco operacional e de seguranca | selecao hierarquica com bloqueio inline |
| Explicar status, bloqueios e excecoes | existem varias regras de permissao e consistencia | banners, badges, mensagens orientativas e telas de bloqueio |
| Apoiar iniciantes e avancados | a modelagem e complexa | ajuda contextual curta e secoes avancadas recolhidas |

## 4. Personas e perfis de usuario

| Perfil de usuario | Objetivo | Conhecimento esperado | Necessidades | Restricoes |
| --- | --- | --- | --- | --- |
| Administrador da plataforma | estruturar empresas, estabelecimentos e grants | Alto | visao completa, impactos e historico | nao sai do tenant |
| Gestor corporativo | consultar varias empresas e consolidar visoes | Medio/alto | filtros multiempresa e drill-down | em geral nao altera estrutura juridica |
| Controladoria | parametrizar e executar consolidacao | Alto | revisao formal, divergencias e rastreabilidade | depende de dados e mapeamentos corretos |
| Gestor de empresa | operar empresa e filiais vinculadas | Medio | visao da empresa, seus estabelecimentos e contexto ativo | sem acesso a empresas nao vinculadas |
| Gestor de filial | operar filial especifica | Medio | clareza do contexto local | sem manutencao juridica |
| Operador | trabalhar no escopo correto | Baixo/medio | pouco atrito e feedback imediato | sem administracao estrutural |
| Auditor | rastrear eventos, bloqueios e historico | Alto | timeline, filtros e origem das acoes | sem edicao |
| Usuario mobile recorrente | consultar e trocar contexto rapidamente | Baixo/medio | simplicidade e alvos de toque adequados | menos espaco de tela |

## 5. Jornada do usuario

### Antes de acessar a funcionalidade

- Motivacoes: criar estrutura, revisar acesso, trocar contexto, consultar consolidado ou auditar alteracoes
- Dados necessarios: autenticacao valida, tenant carregado e grants disponiveis
- Pre-condicoes: permissao compatível com a acao desejada
- Expectativas: entender rapidamente o escopo e as acoes possiveis

### Durante o uso

- Entrada na tela: sistema restaura ou solicita contexto
- Consulta: usuario visualiza estrutura, filtros, status e historico
- Preenchimento: formularios segmentados por blocos logicos
- Validacoes: inline, antes do submit e na revisao final
- Confirmacoes: grants, inativacao, arquivamento e consolidacao
- Acoes principais: criar, editar, trocar contexto, gerenciar grants, consolidar
- Acoes secundarias: filtrar, exportar, ver historico, revisar divergencias
- Feedbacks: sucesso, erro, alerta, bloqueio, processamento e conflito

### Depois da acao

- Resultado esperado: dado salvo no escopo correto e refletido na interface
- Proximos passos: seguir para detalhe, grants, nova filial ou run
- Notificacoes: banner inline, snackbar curto e atualizacao do status
- Possibilidade de revisao: historico, resumo de alteracoes e trilha auditavel
- Historico visivel: disponivel nas acoes criticas

| Etapa da jornada | Acao do usuario | Necessidade | Dor potencial | Solucao UX |
| --- | --- | --- | --- | --- |
| Entrada | abrir o modulo | entender contexto atual | nao saber onde esta gravando | context bar persistente |
| Consulta | filtrar empresas/filiais | localizar rapido | lista extensa e ambigua | filtros por tipo, status e regime |
| Criacao | cadastrar empresa | preencher corretamente | campos juridicos complexos | formulario por secoes com ajuda contextual |
| Estrutura | cadastrar matriz ou filial | nao confundir tipos | inferencia errada por CNPJ | campo explicito de tipo |
| Permissoes | conceder grants | evitar erro de acesso | filial fora da empresa | selecao hierarquica com bloqueio |
| Operacao | trocar contexto | gravar no local certo | confundir leitura e escrita | separacao visual forte |
| Consolidacao | iniciar run | entender impacto | executar com parametros incompletos | checklist e revisao obrigatoria |
| Pos-acao | revisar resultado | ganhar confianca | duvida sobre efeito real | historico, status e trilha visual |

## 6. Fluxo de navegacao

```text
[Acesso/Login]
  -> [Restauracao ou Selecao de Contexto]
    -> [Base e Governanca]
      -> [Visao Geral Multiempresa]
        -> [Lista de Empresas]
          -> [Nova Empresa]
          -> [Detalhe da Empresa]
            -> [Editar Empresa]
            -> [Cadastrar Matriz/Filial]
            -> [Gerenciar Estabelecimentos]
            -> [Historico]
        -> [Gestao de Grants]
        -> [Leitura Consolidada]
          -> [Drill-down por empresa/filial]
        -> [Consolidacao]
          -> [Nova Run]
          -> [Detalhe da Run]
        -> [Politicas de Compartilhamento] (avancado)
```

| Origem | Acao | Destino | Condicao | Observacao |
| --- | --- | --- | --- | --- |
| Login | restaurar sessao | contexto ou visao geral | conforme grants e ultimo contexto | se houver um unico escopo valido, pode entrar direto |
| Cabecalho global | trocar contexto | seletor de contexto | usuario com mais de um escopo | bottom sheet no mobile, painel no desktop |
| Visao geral | ver empresas | lista de empresas | permissao de leitura | fluxo base do modulo |
| Lista | criar empresa | cadastro de empresa | permissao de criacao | pagina dedicada |
| Detalhe da empresa | nova matriz/filial | cadastro de estabelecimento | empresa valida | herdar empresa no formulario |
| Detalhe da empresa | gerenciar grants | tela de grants | permissao elevada | precisa explicar impacto |
| Visao geral | leitura consolidada | dashboard/lista consolidada | permissao de leitura consolidada | nao muda o contexto de escrita |
| Area de consolidacao | executar run | configuracao da run | permissao e pre-validacoes minimas | fluxo formal em etapas |

## 7. Arquitetura da informacao

| Grupo de informacao | Campos ou conteudos | Prioridade visual | Observacoes |
| --- | --- | --- | --- |
| Contexto ativo | empresa ativa, estabelecimento ativo, escopo de leitura | Alta | sempre visivel |
| Resumo estrutural | total de empresas, filiais ativas, pendencias | Alta | cards no topo |
| Dados juridicos da empresa | razao social, natureza juridica, pais, regime, abertura | Alta | secao principal do cadastro |
| Dados do estabelecimento | tipo, principal, CNPJ, CNAE, endereco, status | Alta | secao principal do estabelecimento |
| Grants e defaults | empresas autorizadas, estabelecimentos autorizados, padroes | Alta | tela propria |
| Compartilhamento | scopeType, shareMode e politica | Media | area avancada |
| Consolidacao | participantes, periodo, moeda, percentual, calendario, status | Alta | fluxo proprio |
| Historico e auditoria | ator, data, justificativa e before/after | Media | detalhe e timeline |
| Dados regulatorios | inscricoes, licencas e anexos | Media | secoes expansivas |
| Configuracoes futuras | grupo economico, unidade operacional, intercompany | Baixa | preparadas para evolucao |

Regras de posicionamento:

- topo da tela: titulo, breadcrumb, contexto ativo, status e acoes principais;
- cards de resumo: empresas, estabelecimentos, pendencias e eventos recentes;
- listas e tabelas: empresas, filiais, grants e runs;
- abas: `Resumo`, `Estabelecimentos`, `Acessos`, `Historico`, `Consolidacao`;
- secoes expansivas: dados regulatorios e configuracoes avancadas;
- detalhes avancados: `shareMode`, `masterCompanyId` e parametros avancados.

## 8. Mapa de telas

| Tela | Objetivo | Perfil que usa | Acoes principais | Acoes secundarias |
| --- | --- | --- | --- | --- |
| Selecao de contexto | definir o escopo ativo | todos os perfis operacionais | selecionar empresa/estabelecimento, confirmar | revisar grants |
| Visao geral multiempresa | resumir a estrutura e oferecer atalhos | admin, gestores, auditor | acessar empresas, grants e consolidacao | filtrar e consultar historico recente |
| Lista de empresas | localizar e consultar empresas | admin, gestor corporativo | filtrar, abrir detalhe, criar empresa | exportar |
| Detalhe da empresa | entender a estrutura da empresa | admin, gestor corporativo, gestor empresa | editar, criar matriz/filial, ver grants | historico e dados regulatorios |
| Cadastro/edicao de empresa | criar ou alterar entidade legal | admin | salvar, ativar, inativar | cancelar, revisar |
| Cadastro/edicao de estabelecimento | criar ou alterar matriz/filial | admin | salvar, ativar, inativar | cancelar, revisar vinculos |
| Gestao de grants | vincular usuarios a empresas e filiais | admin | adicionar/remover grants, definir defaults | pesquisar usuario |
| Leitura consolidada | consultar multiplos escopos autorizados | gestor corporativo, auditor | filtrar, drill-down, exportar | salvar visao |
| Configuracao de consolidacao | parametrizar run formal | controladoria, gestor autorizado | selecionar escopos, revisar, executar | salvar rascunho |
| Detalhe da run | acompanhar resultado e divergencias | controladoria, auditor | ver status e divergencias | exportar, reprocessar |
| Historico/auditoria | ver trilha de mudancas | auditor, admin | filtrar eventos | abrir detalhe do evento |
| Estados especiais | explicar vazio, erro ou bloqueio | todos | tentar novamente, ajustar filtros | voltar |

## 9. Wireframes textuais

```text
[Selecao de Contexto]

[Escolha onde voce vai operar]

[Area principal]
- Lista de empresas autorizadas
- Ao selecionar empresa, lista de estabelecimentos validos
- Bloco separado para escopos de leitura consolidada

[Acoes]
- Botao primario: Confirmar contexto de escrita
- Botao secundario: Continuar em leitura, se permitido

[Feedback]
- Aviso quando o usuario tem apenas leitura consolidada
- Erro quando o escopo perdeu validade
```

```text
[Visao Geral Multiempresa]

[Resumo da estrutura e do contexto atual]

[Topo]
- Breadcrumb
- Badge de contexto de escrita
- Chips de escopo de leitura
- CTA: Nova empresa
- CTA: Trocar contexto

[Area principal]
- Cards: Empresas ativas, filiais ativas, pendencias, trocas de contexto recentes
- Lista rapida de empresas
- Bloco de acoes de governanca

[Feedback]
- Empty state para tenant sem estrutura
- Banner de pendencias
```

```text
[Listagem de Empresas]

[Area de filtros]
- Busca por nome/CNPJ
- Status
- Tipo de estabelecimento
- Regime tributario
- Empresa/escopo

[Area principal]
- Tabela no desktop
- Cards no mobile
- Cada item mostra nome, status, regime, matriz/filiais e acoes

[Acoes]
- Novo cadastro
- Abrir detalhe
- Exportar consulta
```

```text
[Cadastro/Edição de Empresa]

[Secoes]
- Identificacao
- Dados juridicos
- Tributacao e calendario
- Consolidacao
- Revisao final

[Acoes]
- Salvar rascunho
- Salvar e ativar
- Cancelar

[Feedback]
- Validacao inline
- Resumo fixo de erros apos tentativa de salvar
```

```text
[Detalhe da Empresa]

[Topo]
- Nome da empresa
- Status badge
- Acoes: Editar, Nova matriz/filial, Inativar

[Abas]
- Resumo
- Estabelecimentos
- Acessos
- Historico
- Consolidacao

[Area principal]
- Card juridico
- Card tributario
- Lista de estabelecimentos
- Timeline de eventos
```

```text
[Cadastro/Edição de Estabelecimento]

[Secoes]
- Tipo e vinculo
- Identificacao legal
- CNAE e operacao
- Endereco
- Inscricoes e licencas
- Contato

[Acoes]
- Salvar
- Salvar e ativar
- Cancelar

[Feedback]
- Mensagem sobre tipo explicito
- Alerta se ja existe matriz principal ativa
```

```text
[Gestao de Grants]

[Area principal]
- Busca de usuario
- Coluna esquerda: empresas autorizaveis
- Coluna direita: estabelecimentos da empresa selecionada
- Bloco de defaults
- Bloco de resumo do acesso final

[Acoes]
- Salvar grants
- Remover acesso
- Restaurar padrao

[Feedback]
- Bloqueio imediato de combinacoes inconsistentes
- Confirmacao clara para remocoes amplas
```

```text
[Leitura Consolidada]

[Area de filtros]
- Empresas
- Estabelecimentos
- Periodo
- Dominio
- Status/processamento

[Area principal]
- Cards de indicadores
- Lista consolidada
- Drill-down por empresa e filial

[Feedback]
- Selo "Somente leitura consolidada"
- Indicador de resultado parcial, em processamento ou derivado de run
```

```text
[Configuracao de Consolidacao]

[Etapas]
- Escopos participantes
- Periodo e calendario
- Moeda, taxa e percentual
- Regras de eliminacao/reconciliacao
- Revisao

[Acoes]
- Salvar rascunho
- Executar consolidacao

[Feedback]
- Checklist pre-execucao
- Bloqueios com lista explicita do que falta
```

## 10. Componentes de interface

| Componente | Tipo | Uso | Dados exibidos | Interacoes | Estados |
| --- | --- | --- | --- | --- | --- |
| App shell com context bar | Pagina/base | envolver todo o modulo | contexto de escrita e leitura | trocar contexto | normal, bloqueado |
| Cabecalho de modulo | Cabecalho | titulo, breadcrumb e CTAs | nome da tela | navegacao e acoes | normal |
| Context badge | Badge/status | evidenciar escopo ativo | empresa, filial, modo | abrir seletor | normal, alerta |
| Summary cards | Card | resumir a estrutura | totais, pendencias, eventos | abrir detalhes | loading, com dados, vazio |
| Filter bar | Filtro | consultas e consolidado | empresa, status, tipo, periodo | aplicar, limpar | aberto, recolhido |
| Tabela responsiva | Tabela/lista | listagens desktop | empresas, filiais, status | ordenar, paginar | loading, vazio, erro |
| Cards de listagem | Lista/card | listagens mobile | resumo do item | expandir, abrir detalhe | loading, vazio |
| Form section | Formulario | agrupar campos | blocos logicos | expandir/recolher | normal, erro |
| Select hierarquico | Select/tree | grants e contexto | empresa e estabelecimento | selecionar, desmarcar | habilitado, bloqueado |
| Status badge | Badge | mostrar estados | ativo, inativo, arquivado | tooltip opcional | info, sucesso, alerta |
| Timeline de auditoria | Timeline | exibir eventos | ator, data, acao, justificativa | filtrar, expandir | loading, vazio |
| Banner de alerta | Banner | exibir bloqueios e pendencias | mensagem e CTA | fechar ou agir | info, alerta, erro |
| Snackbar | Feedback | confirmacoes rapidas | sucesso ou erro breve | dispensar | sucesso, erro |
| Empty state | Estado | ausencia de dados | titulo, descricao, CTA | navegar, criar | vazio |
| Skeleton/loading | Estado | espera de dados | estrutura visual da tela | sem interacao | loading |
| Stepper de consolidacao | Etapas | guiar a run formal | etapas e pendencias | avancar, voltar | atual, concluida, bloqueada |
| Painel lateral/bottom sheet | Container | trocar contexto e filtrar | listas e selecoes | abrir, confirmar, fechar | aberto, loading |
| Action bar fixa | Acoes | salvar/cancelar no mobile | CTAs primarias | tocar, confirmar | habilitada, desabilitada |

## 11. Campos e comportamento de interface

| Campo | Tipo de componente | Obrigatorio | Placeholder | Ajuda contextual | Validacao inline | Mensagem de erro | Comportamento |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `activeCompanyId` | Select | Sim para escrita | Selecione a empresa ativa | define onde a gravacao ocorrera | Sim | Selecione uma empresa para continuar | persistente no cabecalho |
| `activeEstablishmentId` | Select dependente | Condicional | Selecione o estabelecimento | obrigatorio quando o fluxo exigir | Sim | Selecione um estabelecimento valido | depende da empresa ativa |
| `selectedReadCompanyIds` | Multi-select | Nao | Selecione empresas para leitura | nao altera escrita | Sim | Voce so pode consultar empresas autorizadas | persistencia por sessao |
| `selectedReadEstablishmentIds` | Multi-select | Nao | Selecione filiais para leitura | refinamento do consolidado | Sim | Existem estabelecimentos fora do escopo autorizado | depende das empresas de leitura |
| `legalName` | Campo de texto | Sim | Razao social | nome juridico da entidade legal | Sim | Informe a razao social | limpar espacos extras |
| `tradeName` | Campo de texto | Nao | Nome fantasia | opcional | Sim | Nome fantasia invalido | pode ficar vazio |
| `companyRootRegistration` | Campo de texto | Sim | Raiz cadastral | no Brasil deriva do CNPJ | Sim | Identificador raiz invalido | mascara por pais |
| `legalNatureCode` | Select/autocomplete | Sim | Selecione a natureza juridica | tabela externa | Sim | Natureza juridica invalida | busca assistida |
| `countryCode` | Select | Sim | Pais | define regras de formatacao | Sim | Pais invalido | padrao `BR` |
| `openingDate` | Date picker | Sim | dd/mm/aaaa | data de abertura legal | Sim | Data de abertura invalida | nao aceitar data futura sem politica |
| `regimeTributario` | Select | Sim | Selecione o regime | pertence a empresa | Sim | Selecione um regime tributario valido | ajuda contextual opcional |
| `defaultCurrency` | Select | Sim | Selecione a moeda | moeda funcional | Sim | Moeda invalida | padrao pela localizacao |
| `fiscalCalendarId` | Select | Sim | Selecione o calendario | impacta consolidacao | Sim | Calendario fiscal invalido | pode depender do pais |
| `consolidationMode` | Select | Sim | Selecione o modo | define profundidade do consolidado | Sim | Modo de consolidacao invalido | `FULL` sugerido |
| `establishmentType` | Radio/segmented control | Sim | - | escolha explicita entre matriz e filial | Sim | Defina se o estabelecimento e matriz ou filial | nunca inferir pelo CNPJ |
| `isPrincipal` | Switch | Sim | - | indica matriz principal ativa | Sim | Ja existe uma matriz principal ativa | desabilitado para filial |
| `cnpj` | Campo mascarado | Sim no Brasil | 00.000.000/0000-00 | aceita numerico e alfanumerico conforme regra | Sim | Informe um CNPJ valido | nao deriva tipo |
| `cnpjRoot` | Campo somente leitura | Sim | Derivado | deve casar com a empresa | Sim | Raiz do CNPJ inconsistente | derivado do CNPJ |
| `establishmentOrder` | Campo curto | Sim | 0001 | ordem do estabelecimento | Sim | Ordem do estabelecimento invalida | pode ser alfanumerica |
| `legalNameAtEstablishment` | Campo de texto | Sim | Nome empresarial | nome exibido no estabelecimento | Sim | Nome invalido | pode iniciar com a razao social |
| `tradeNameAtEstablishment` | Campo de texto | Nao | Nome fantasia local | opcional | Sim | Nome fantasia invalido | pode diferir da empresa |
| `cnaePrincipal` | Autocomplete | Sim | Digite ou selecione o CNAE | deve refletir a atividade local | Sim | Informe um CNAE principal valido | busca por codigo e descricao |
| `cnaesSecundarios` | Multi-autocomplete | Nao | Adicione CNAEs secundarios | sem duplicidade | Sim | CNAEs secundarios invalidos | chips removiveis |
| `address` | Grupo de campos | Sim | Endereco completo | campos minimos por pais | Sim | Endereco invalido | secao propria |
| `postalCode` / `stateCode` / `cityCode` | Campos dependentes | Condicional | CEP/UF/Municipio | dependem do pais | Sim | CEP, UF ou municipio invalido | auto preenchimento quando possivel |
| `localTaxRegistrations` | Repeater | Parametrizado | Adicionar inscricao | IE, IM e afins | Sim | Inscricao local invalida | secao expansivel |
| `localLicenses` | Repeater | Parametrizado | Adicionar licenca | conforme orgao/atividade | Sim | Licenca invalida | secao avancada |
| `contactEmail` | Campo de e-mail | Recomendado | contato@empresa.com | canal principal | Sim | E-mail invalido | teclado adequado no mobile |
| `contactPhone` | Campo mascarado | Recomendado | (00) 00000-0000 | canal principal | Sim | Telefone invalido | mascara por pais |
| `allowedCompanyIds` | Select hierarquico | Sim | Selecione empresas autorizadas | define escopo maximo | Sim | O usuario precisa de ao menos uma empresa valida | base dos grants |
| `allowedEstablishmentIds` | Select hierarquico | Nao | Selecione estabelecimentos | mais restritivo que a empresa | Sim | O estabelecimento nao pertence a empresa concedida | depende da empresa concedida |
| `defaultCompanyId` | Select | Nao | Empresa padrao | sugerida na sessao | Sim | A empresa padrao deve ser autorizada | opcional |
| `defaultEstablishmentId` | Select | Nao | Estabelecimento padrao | sugerido na sessao | Sim | O estabelecimento padrao deve ser autorizado | opcional |
| `scopeType` | Select | Sim em area avancada | Selecione o tipo de escopo | `GLOBAL`, `COMPANY`, `ESTABLISHMENT` | Sim | Tipo de escopo invalido | exibir com explicacao curta |
| `shareMode` | Select | Condicional | Selecione o modo | `NONE`, `SINGLE_MASTER`, `REPLICATED` | Sim | Modo de compartilhamento invalido | campo avancado |
| `masterCompanyId` | Select | Condicional | Empresa mestre | usado em `SINGLE_MASTER` | Sim | Empresa mestre invalida | so aparece quando aplicavel |
| `sharingPolicyId` | Select | Condicional | Selecione a politica | define governanca | Sim | Politica de compartilhamento invalida | so para perfis avancados |
| Parametros da run | Grupo de campos | Sim | Selecione empresas, periodo e criterios | define escopo da consolidacao | Sim | Existem parametros obrigatorios pendentes | fluxo em etapas |

## 12. Estados da interface

| Estado | Quando ocorre | O que mostrar | Acao disponivel |
| --- | --- | --- | --- |
| Inicial | primeira entrada | skeleton e contexto pendente | aguardar ou selecionar contexto |
| Carregando | busca de lista, detalhe ou grants | skeleton e desabilitacao parcial | aguardar |
| Vazio | sem empresas ou sem resultados | empty state com CTA | criar, limpar filtro ou voltar |
| Com dados | dados validos carregados | conteudo completo | consultar, editar, filtrar |
| Erro | falha inesperada | banner de erro com contexto | tentar novamente |
| Sem permissao | usuario nao pode acessar a area | estado bloqueado com explicacao | voltar ou trocar contexto |
| Dados invalidos | campo ou combinacao invalida | erros inline e resumo no topo | corrigir e reenviar |
| Salvando | submit em andamento | botao bloqueado e progresso | aguardar |
| Sucesso | operacao concluida | confirmacao curta e status atualizado | continuar |
| Alerta | pendencia ou risco detectado | banner amarelo e CTA | revisar ou prosseguir |
| Bloqueado | regra impede a acao | texto claro do motivo | ajustar pre-condicao |
| Offline | rede indisponivel | banner persistente | tentar depois |
| Timeout | resposta excedeu o esperado | mensagem com retry | tentar novamente |
| Integracao indisponivel | dependencia externa falhou | aviso de indisponibilidade parcial | repetir ou salvar rascunho |
| Conflito de versao | registro alterado por outra pessoa | banner de conflito | recarregar e revisar |
| Processando run | consolidacao em andamento | status em progresso e etapas | acompanhar ou sair |
| Resultado parcial | consolidado incompleto ou divergente | selo de parcial/divergente | revisar divergencias |

## 13. Mensagens da interface

| Situacao | Mensagem | Tipo | Local de exibicao |
| --- | --- | --- | --- |
| Empresa criada | Empresa salva com sucesso. | Sucesso | topo/snackbar |
| Estabelecimento criado | Estabelecimento salvo com sucesso. | Sucesso | topo/snackbar |
| Contexto ausente | Selecione uma empresa e, quando necessario, um estabelecimento para continuar. | Erro | banner superior |
| Acesso negado | Voce nao possui permissao para operar neste escopo. | Bloqueio | pagina/banner |
| Tipo ausente | Defina explicitamente se o estabelecimento e matriz ou filial. | Validacao inline | campo `establishmentType` |
| CNPJ invalido | Informe um CNPJ valido para este pais. | Validacao inline | campo `cnpj` |
| CNPJ duplicado | Ja existe um estabelecimento com este identificador no tenant atual. | Erro | topo e campo |
| CNAE invalido | Informe um CNAE compativel com as atividades deste estabelecimento. | Validacao inline | campo `cnaePrincipal` |
| Regime invalido | Selecione um regime tributario valido para a empresa. | Validacao inline | campo `regimeTributario` |
| Grant inconsistente | O estabelecimento selecionado nao pertence a empresa concedida. | Erro | tela de grants |
| Contexto alterado | Seu contexto operacional foi atualizado. | Informacao | snackbar/context bar |
| Conflito de versao | Este registro foi alterado por outra pessoa. Atualize a tela e revise antes de salvar novamente. | Erro | banner superior |
| Arquivamento bloqueado | Este registro possui dependencias e nao pode ser excluido. Inative ou arquive conforme a politica. | Alerta | area de acoes |
| Consolidacao iniciada | A consolidacao foi iniciada e esta sendo processada. | Informacao | detalhe da run |
| Consolidacao concluida | Consolidacao concluida com sucesso. | Sucesso | detalhe da run |
| Consolidacao com divergencia | A consolidacao terminou com divergencias que exigem revisao. | Alerta | detalhe da run |
| Sem resultados | Nenhum resultado foi encontrado com os filtros aplicados. | Informacao | empty state |
| Sem rede | Voce esta sem conexao. Algumas acoes de gravacao estao temporariamente indisponiveis. | Alerta | banner persistente |

## 14. Microinteracoes

| Interacao | Feedback esperado | Objetivo |
| --- | --- | --- |
| Troca de contexto | atualizacao imediata do context bar e snackbar curto | confirmar mudanca de escopo |
| Selecao de empresa em grants | expandir filiais elegiveis | reforcar hierarquia |
| Campo invalido | borda, icone e texto proximo ao campo | corrigir cedo |
| Salvar formulario | botao entra em loading e evita clique duplo | prevenir duplicidade |
| Aplicar filtro | chips ativos e contador de resultados | dar nocao de escopo filtrado |
| Expandir secao avancada | animacao curta e preservacao do scroll | reduzir carga cognitiva |
| Selecionar multiplas empresas para leitura | atualizar resumo de escopos selecionados | tornar leitura consolidada explicita |
| Tentar acao sem permissao | bloqueio visual com mensagem contextual | evitar duvida sobre falha |
| Receber conflito de versao | banner persistente com CTA de recarregar | evitar sobrescrita silenciosa |
| Executar run | stepper avanca e trava parametros | comunicar formalidade do processo |
| Inativar/arquivar | tela de revisao final com justificativa obrigatoria | reduzir erro em acao critica |

## 15. Acessibilidade

| Requisito | Aplicacao na funcionalidade | Criterio de validacao |
| --- | --- | --- |
| Labels visiveis | todos os campos criticos | nenhum campo depende apenas de placeholder |
| Ordem logica de foco | formularios, filtros e grants | navegacao por `Tab` respeita a hierarquia visual |
| Navegacao por teclado | listas, filtros e acoes principais | acoes criticas podem ser executadas sem mouse |
| Foco visivel | botoes, tabs, chips e linhas selecionaveis | elemento focado tem contorno claro |
| Compatibilidade com leitor de tela | context bar, badges e mensagens | labels descrevem empresa ativa, filial e status |
| Contraste adequado | banners, statuses e CTAs | informacao critica atende contraste minimo |
| Tamanho minimo de toque | chips, acoes rapidas e botoes | alvos confortaveis no mobile |
| Erro associado ao campo | CNPJ, CNAE, regime, grants | erro fica junto ao campo afetado |
| Nao depender so de cor | status e bloqueios | sempre usar texto/icone junto |
| Confirmacao em acoes destrutivas | inativar, arquivar e remocoes amplas | existe revisao antes da confirmacao |
| Linguagem simples | mensagens e ajuda contextual | texto explica problema e proximo passo |

## 16. Responsividade

| Contexto | Comportamento esperado | Ajustes de layout |
| --- | --- | --- |
| Desktop | navegacao ampla e produtividade | tabelas completas e painel lateral |
| Tablet paisagem | equilibrio entre densidade e toque | duas colunas em formularios |
| Tablet retrato | priorizacao de leitura e acao | cards no topo e filtros recolhiveis |
| Mobile | foco na tarefa atual | cards, action bar fixa e bottom sheet |
| Web responsivo | adaptacao progressiva | colapso de colunas |
| App mobile | operacao rapida com contexto visivel | header compacto e CTA no rodape quando necessario |
| Orientacao paisagem | mais espaco para listas | filtros horizontais e tabelas simplificadas |

Regras de adaptacao:

- tabelas colapsam em cards no mobile;
- filtros multiempresa viram painel recolhivel em telas menores;
- acoes primarias ficam fixas no rodape em formularios mobile;
- o contexto de escrita nunca pode desaparecer da area visivel principal.

## 17. Regras de usabilidade

| Regra de usabilidade | Aplicacao | Beneficio |
| --- | --- | --- |
| Mostrar sempre o contexto de escrita | cabecalho persistente | reduz erro operacional |
| Nao misturar leitura e escrita visualmente | blocos e labels distintos | evita ambiguidade |
| Reduzir numero de cliques | defaults, atalhos e filtros persistentes | acelera uso recorrente |
| Validar antes do envio | grants, CNPJ, CNAE e vinculos | previne retrabalho |
| Manter a acao principal visivel | action bar fixa e CTA destacado | melhora conclusao |
| Diferenciar acao destrutiva | estilo visual e confirmacao | reduz erro humano |
| Exibir impacto antes de confirmar | revisao de grants e consolidacao | aumenta seguranca |
| Usar linguagem do dominio | empresa, matriz, filial, escopo e consolidado | melhora compreensao |
| Exibir feedback imediato | banners, badges e snackbars | aumenta confianca |
| Preservar contexto ao retornar | lista volta com filtros mantidos | evita perda de produtividade |
| Esconder complexidade avancada por padrao | secoes recolhidas | reduz carga cognitiva |

## 18. Criterios de aceite UX/UI

| ID | Cenario UX/UI | Dado que | Quando | Entao |
| --- | --- | --- | --- | --- |
| UX-AC-001 | Contexto visivel | o usuario esta em qualquer tela de escrita | a tela e carregada | o contexto de escrita aparece de forma persistente e legivel |
| UX-AC-002 | Selecao inicial de contexto | o usuario tem mais de um escopo valido | entra no modulo sem contexto restauravel | o sistema solicita selecao antes de permitir escrita |
| UX-AC-003 | Diferenca entre leitura e escrita | o usuario possui leitura multiempresa e escrita em um unico escopo | abre a visao consolidada | a interface mostra que o filtro de leitura nao altera o contexto de escrita |
| UX-AC-004 | Estado vazio | nao existem empresas cadastradas | o usuario acessa a lista | a tela mostra empty state com CTA para criar empresa |
| UX-AC-005 | Estado de loading | a consulta ainda esta em andamento | a tela e aberta | a interface mostra skeleton sem salto brusco de layout |
| UX-AC-006 | Validacao inline | o usuario deixa campo obrigatorio vazio ou escolhe valor invalido | tenta salvar | o erro aparece junto ao campo e explica como corrigir |
| UX-AC-007 | Bloqueio de grant inconsistente | o administrador concede estabelecimento fora da empresa selecionada | tenta salvar os grants | a interface bloqueia e explica a inconsistência antes do envio |
| UX-AC-008 | Tipo explicito de estabelecimento | o usuario cria um estabelecimento | nao define matriz ou filial | a interface exige selecao explicita do tipo |
| UX-AC-009 | Bloqueio de segunda matriz principal | a empresa ja possui matriz principal ativa | o administrador tenta marcar outra matriz principal | a interface alerta e impede a conclusao |
| UX-AC-010 | Acao sem permissao | o usuario tenta abrir area fora do grant | acessa a acao | a interface exibe bloqueio compreensivel e oferece retorno seguro |
| UX-AC-011 | Sucesso de cadastro | os dados validos foram enviados | o salvamento termina | a tela confirma sucesso e atualiza o status visual |
| UX-AC-012 | Conflito de versao | o registro foi alterado por outra pessoa | o usuario tenta salvar | a interface informa o conflito e oferece recarregar |
| UX-AC-013 | Responsividade | o usuario acessa a lista em mobile | a listagem e exibida | a tabela colapsa em cards sem perda essencial |
| UX-AC-014 | Acessibilidade de formulario | o usuario navega por teclado ou leitor de tela | percorre a tela de cadastro | labels, foco e mensagens permanecem compreensiveis |
| UX-AC-015 | Consolidacao com bloqueio | faltam parametros ou mapeamentos obrigatorios | o usuario tenta executar a run | a tela lista as pendencias e bloqueia a execucao |
| UX-AC-016 | Confirmacao de acao critica | o usuario inativa, arquiva ou executa consolidacao critica | avanca na acao | a interface exige revisao e confirmacao explicita |
| UX-AC-017 | Feedback de troca de contexto | o usuario altera empresa ou filial ativa | confirma a mudanca | o cabecalho e atualizado e a tela informa a troca |
| UX-AC-018 | Estado offline | a rede esta indisponivel | o usuario abre tela de escrita | a interface informa indisponibilidade e evita falsa confirmacao |

## 19. Riscos de experiencia

- contexto de leitura e escrita com o mesmo peso visual pode induzir gravacao errada;
- grants sem hierarquia visivel podem gerar acesso indevido;
- consolidacao simplificada demais pode transmitir falsa seguranca;
- excesso de campos regulatorios em uma unica etapa pode aumentar abandono;
- conceitos ainda nao fechados, como `grupo economico` e `unidade operacional`, podem confundir o V1;
- mensagens genericas de bloqueio aumentam suporte e reduzem confianca.

## 20. Recomendacoes

- tratar troca de contexto como componente de plataforma e nao como detalhe local;
- usar paginas de revisao para acoes criticas em vez de modais centrais;
- priorizar no V1 os fluxos estruturais, grants e leitura consolidada;
- manter consolidacao em area propria com linguagem de processo formal;
- preparar o design system para badges de contexto, status regulatorio e processamento;
- incluir ajuda contextual curta em tipo do estabelecimento, grants, leitura x escrita e consolidacao.

## 21. Checklist para design e frontend

### Estrutura

- [ ] Tela principal definida
- [ ] Tela de detalhe definida
- [ ] Tela de criacao/edicao definida
- [ ] Fluxos alternativos definidos

### Interface

- [ ] Componentes mapeados
- [ ] Campos especificados
- [ ] Estados definidos
- [ ] Mensagens definidas
- [ ] Responsividade definida

### Acessibilidade

- [ ] Labels definidos
- [ ] Ordem de foco definida
- [ ] Contraste considerado
- [ ] Navegacao por teclado considerada
- [ ] Mensagens de erro associadas aos campos

### Validacao

- [ ] Criterios de aceite UX/UI definidos
- [ ] Casos de erro definidos
- [ ] Casos sem permissao definidos
- [ ] Estados vazios definidos

## 22. Pendencias para validacao humana

1. Confirmar se `unidade operacional` ficara abaixo de `empresa`, de `estabelecimento` ou com parent configuravel.
2. Confirmar se `GrupoEconomico` entra ou nao como entidade visivel no V1.
3. Fechar com controladoria os parametros obrigatorios da run de consolidacao.
4. Confirmar o escopo real de `MEI` no release inicial.
5. Fechar a matriz de `scopeType` e `shareMode` por dominio antes de detalhar a UX avancada.
6. Detalhar inscricoes e licencas locais por UF, municipio e setor.
7. Confirmar se controladoria tera tela propria ou compartilhara a area de consolidacao com gestor corporativo no V1.
