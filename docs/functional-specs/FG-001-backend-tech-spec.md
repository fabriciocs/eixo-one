# Especificacao Tecnica Backend - FG-001 Multiempresa e Multifilial

## Documentos relacionados

- [FG-001-multiempresa-multifilial.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-multiempresa-multifilial.md)
- [FG-001-ux-ui-spec.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-ux-ui-spec.md)
- [FG-001-backlog.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-backlog.md)
- [FG-001-execution-plan.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-execution-plan.md)

## 1. Resumo tecnico

`FG-001 - Multiempresa e multifilial` define a base backend de governanca organizacional do EixoOne para operacao de multiplas empresas, matriz, filiais e escopos autorizados dentro do mesmo tenant.

A implementacao backend deve preservar os seguintes principios:

- `empresa` e a entidade legal principal;
- `matriz` e `filial` sao estabelecimentos da mesma empresa;
- leitura pode abranger varios escopos autorizados;
- escrita exige contexto operacional unico e explicito;
- compartilhamento de dados cross-company e excecao governada por politica;
- consolidacao corporativa e um processo formal, auditavel e reexecutavel;
- autorizacao nunca depende apenas do frontend;
- Firestore e usado com isolamento estrito por tenant e com controle adicional por empresa e estabelecimento.

Backend alvo:

- Node.js 22 LTS
- TypeScript
- Fastify
- Firebase Auth
- Firestore
- Firebase Admin SDK
- contratos compartilhados em `packages/shared_contracts`
- validacao com Zod
- auditoria, idempotencia, correlationId e logs JSON

## 2. Funcionalidade analisada

- Nome: `FG-001 - Multiempresa e multifilial`
- Modulo: `Base e Governanca`
- Dominio tecnico: `governance`
- Objetivo: permitir cadastrar, governar e operar empresas, matriz, filiais, grants, contexto operacional, leitura consolidada e consolidacao no mesmo tenant
- Usuarios envolvidos: administrador da plataforma, gestor corporativo, gestor de empresa, gestor de filial, operador, auditor, controladoria e usuario de integracao/API
- Acoes principais: cadastrar empresa, cadastrar matriz/filial, trocar contexto, conceder grants, consultar consolidado e executar consolidacao
- Entidades principais: `Company`, `Establishment`, `UserScopeGrant`, `UserContext`, `SharingPolicy`, `ConsolidationRun`
- Fluxos impactados: cadastro estrutural, autorizacao, contexto operacional, leitura multiempresa, consolidacao, auditoria e observabilidade
- Complexidade backend: muito alta
- Riscos tecnicos: vazamento cross-tenant, grant inconsistente, escrita no escopo errado, consolidacao sem parametros completos, queries caras e inconsistencias de estado

## 3. Documentos analisados

### Documento funcional principal

- [FG-001-multiempresa-multifilial.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-multiempresa-multifilial.md)

### Documento UX/UI principal

- [FG-001-ux-ui-spec.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-ux-ui-spec.md)

### Documentos complementares

- [FG-001-backlog.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-backlog.md)
- [FG-001-execution-plan.md](/c:/repos/eixo-one/docs/functional-specs/FG-001-execution-plan.md)

## 4. Lacunas, suposicoes e pendencias

| Lacuna tecnica | Origem | Impacto | Gravidade | Suposicao ou pendencia |
| --- | --- | --- | --- | --- |
| Posicao final de `unidade operacional` nao esta fechada | funcional + backlog + UX | afeta grants, ownership e persistencia | Alta | preparar entidade, mas manter fora do escopo implementavel inicial |
| `GrupoEconomico` e opcional e nao confirmado como entidade visivel no V1 | funcional + UX | afeta hierarquia e filtros corporativos | Media | modelar referencia opcional sem obrigatoriedade no fluxo inicial |
| Consolidacao completa e requisito funcional, mas backlog e plano a fatiam em ondas | funcional vs backlog/plano | afeta escopo de implementacao e priorizacao | Alta | backend documenta arquitetura alvo completa e implementacao faseada |
| Catalogos oficiais de CNAE, natureza juridica, regime e calendario nao estao contratados | funcional | afeta validacao semantica e confiabilidade | Alta | backend deve consumir cadastro mestre interno e falhar de forma controlada se o catalogo faltar |
| Politica final de anexos e licencas nao define tipos e limites | funcional + UX | afeta Storage, seguranca e custo | Media | adotar allowlist, limites por ambiente e upload controlado por backend |
| Valores finais de `consolidationMode`, `fxPolicy`, `percentagePolicy` e `eliminationMode` nao estao congelados | funcional + UX | afeta schemas, enums e jobs | Alta | modelar como configuracoes explicitamente validadas e manter `FULL` como minimo obrigatorio |
| Busca textual de listas nao esta detalhada | UX | afeta custo e indices | Media | V1 usa busca por prefixo normalizado e buscas exatas por identificador; full text fica fora do escopo |
| Escrita direta do Flutter no Firestore nao esta confirmada para FG-001 | arquitetura geral | afeta superficie de seguranca | Alta | adotar interpretacao segura: mutacoes e leituras criticas passam pela API Node |
| Escopo inicial de intercompany e parcial | funcional + backlog | afeta contratos e modelo de dados | Alta | preparar contratos e entidade-reserva sem obrigar automacao total no V1 |
| Sessao somente leitura aparece na UX, mas nao detalha persistencia | UX | afeta `UserContext` | Media | permitir contexto sem escrita ativa; qualquer mutacao exige contexto valido na chamada |

### Divergencias entre os documentos e interpretacao backend segura

| Divergencia | Documento principal | Documento complementar | Interpretacao backend segura |
| --- | --- | --- | --- |
| Consolidacao total e requisito forte desde a especificacao funcional | funcional | backlog e execucao fatiam por fases | modelar `ConsolidationRun` e contratos desde o inicio; liberar capacidades por ondas |
| `Unidade operacional` aparece no backlog, mas ainda nao esta fechada funcionalmente | backlog | funcional + UX | preparar estrutura tecnica sem expor endpoints criticos no primeiro incremento |
| Compartilhamento por dominio e central no funcional, mas backlog sugere evolucao | funcional | backlog/plano | criar `SharingPolicy` e regras de validacao desde a base, mas aplicar primeiro aos dominios mais criticos |

## 5. Escopo backend

### Dentro do escopo

- API REST para empresas, estabelecimentos, grants, contexto operacional, politicas de compartilhamento, leituras consolidadas e runs de consolidacao
- modelo Firestore multi-tenant
- contratos compartilhados versionados
- schemas Zod de request, query e response
- validacoes de tenant, empresa, filial, grants, status e duplicidade
- auditoria obrigatoria de acoes criticas
- idempotencia em operacoes criticas
- logs estruturados com correlationId
- regras de Firebase para defesa adicional
- estrategia de testes unitarios, integracao e autorizacao
- controle otimista de concorrencia com `version`

### Fora do escopo

- implementacao de frontend
- codificacao fixa de regras fiscais por setor ou UF
- motor completo de intercompany automatico no primeiro incremento
- busca full text dedicada
- modelagem definitiva de `unidade operacional` sem validacao humana
- consolidacao avancada com todas as eliminacoes automaticas no primeiro incremento

### Dependencias

- Firebase Auth
- Firestore
- Firebase Admin SDK
- `packages/shared_contracts`
- catalogos mestres de CNAE, natureza juridica, regime tributario e calendario fiscal
- modulo de auditoria
- modulo de permissoes e papeis
- infraestrutura de processamento assincrono para consolidacao
- observabilidade operacional

### Premissas tecnicas

- `tenantId` e obtido do token autenticado e nunca confiado do payload do cliente
- toda mutacao de FG-001 passa pela API Node.js
- o backend usa `default deny`
- IDs seguem padrao estavel e ordenavel, preferencialmente `ULID`
- soft delete e usado em vez de exclusao fisica para entidades com historico
- queries expostas a UI sao paginadas
- auditoria e obrigatoria em qualquer alteracao estrutural ou de grants

## 6. Entidades e agregados

| Entidade | Descricao | Tipo | Responsabilidade | Relacionamentos |
| --- | --- | --- | --- | --- |
| `Company` | entidade legal/contabil principal | Entidade principal | governanca juridica e tributaria | 1:N com `Establishment` |
| `Establishment` | matriz ou filial de uma empresa | Entidade principal | escopo operacional e regulatorio | N:1 com `Company` |
| `UserScopeGrant` | grants de acesso por usuario | Entidade principal | restringir leitura e escrita por escopo | referencia `Company` e `Establishment` |
| `UserContext` | contexto ativo e preferencias de leitura | Entidade auxiliar | separar leitura multiempresa e escrita unica | 1:1 com usuario |
| `SharingPolicy` | politica de `scopeType` e `shareMode` | Configuracao | governar dados compartilhados | N:N com empresas participantes |
| `ConsolidationRun` | processo formal de consolidacao | Entidade principal | validar, enfileirar, processar e rastrear consolidacoes | N:N com empresas participantes |
| `ConsolidationIssue` | bloqueios e divergencias da consolidacao | Historico | explicar impedimentos e desvios | N:1 com `ConsolidationRun` |
| `ConsolidationItem` | linha materializada do consolidado | Subdocumento | suportar drill-down e auditoria | N:1 com `ConsolidationRun` |
| `OperationalUnit` | unidade operacional futura | Entidade principal futura | expandir a modelagem sem criar nova entidade legal | parent pendente |
| `AuditEvent` | evento auditavel | Evento | trilha de alteracoes e negacoes | cruza todas as entidades |

### Entidade: Company

Descricao:
representa a entidade legal principal do tenant.

Campos principais:

- `companyId`
- `legalName`
- `tradeName`
- `companyRootRegistration`
- `countryCode`
- `legalNatureCode`
- `openingDate`
- `regimeTributario`
- `defaultCurrency`
- `fiscalCalendarId`
- `consolidationMode`
- `primaryEstablishmentId`
- `groupEconomicId`
- `status`
- `version`

Relacionamentos:

- possui zero ou uma matriz principal ativa
- possui zero ou muitas filiais
- pode pertencer opcionalmente a `GroupEconomic`
- participa de `ConsolidationRun`

Regras associadas:

- pertence a um unico tenant
- nao pode duplicar `companyRootRegistration` no mesmo tenant
- deve usar regime tributario valido
- nao pode ser excluida fisicamente se houver historico

Eventos gerados:

- `company.created`
- `company.updated`
- `company.activated`
- `company.inactivated`
- `company.archived`

Permissoes relacionadas:

- `governance.company.read`
- `governance.company.create`
- `governance.company.update`
- `governance.company.activate`
- `governance.company.inactivate`
- `governance.company.archive`

Dados auditaveis:

- campos juridicos e tributarios
- status
- matriz principal associada

Dados sensiveis:

- licencas e anexos associados

### Entidade: Establishment

Descricao:
representa um estabelecimento da empresa, classificado explicitamente como `MATRIX` ou `BRANCH`.

Campos principais:

- `establishmentId`
- `companyId`
- `establishmentType`
- `isPrincipal`
- `registrationNumber`
- `registrationRoot`
- `establishmentOrder`
- `legalNameAtEstablishment`
- `tradeNameAtEstablishment`
- `cnaePrincipal`
- `cnaesSecundarios`
- `address`
- `localTaxRegistrations`
- `localLicenses`
- `contactEmail`
- `contactPhone`
- `isAdministrative`
- `status`
- `version`

Relacionamentos:

- pertence a uma unica `Company`

Regras associadas:

- `establishmentType` e obrigatorio
- o tipo nunca e inferido pelo registro/CNPJ
- so pode existir uma matriz principal ativa por empresa
- filial pertence a uma unica empresa
- `cnaePrincipal` e obrigatorio

Eventos gerados:

- `establishment.created`
- `establishment.updated`
- `establishment.activated`
- `establishment.inactivated`
- `establishment.archived`

Permissoes relacionadas:

- `governance.establishment.read`
- `governance.establishment.create`
- `governance.establishment.update`
- `governance.establishment.activate`
- `governance.establishment.inactivate`
- `governance.establishment.archive`

Dados auditaveis:

- tipo
- registro principal
- CNAE
- status
- licencas e inscricoes

Dados sensiveis:

- inscricoes locais
- licencas e anexos

### Entidade: UserScopeGrant

Descricao:
define quais empresas e estabelecimentos um usuario pode ler e operar.

Campos principais:

- `userId`
- `allowedCompanyIds`
- `allowedEstablishmentIds`
- `defaultCompanyId`
- `defaultEstablishmentId`
- `roles`
- `permissionOverrides`
- `grantsVersion`
- `readOnlyAllowed`

Regras associadas:

- estabelecimento concedido deve pertencer a empresa concedida
- defaults precisam pertencer ao grant
- leitura pode ser mais ampla que escrita, mas nunca o contrario

Eventos gerados:

- `grant.updated`
- `grant.removed`
- `access.denied`

### Entidade: UserContext

Descricao:
guarda o contexto operacional e as preferencias de leitura do usuario.

Campos principais:

- `userId`
- `activeCompanyId`
- `activeEstablishmentId`
- `selectedReadCompanyIds`
- `selectedReadEstablishmentIds`
- `writeEnabled`
- `lastSwitchedAt`
- `contextVersion`

Regras associadas:

- se `writeEnabled=true`, o contexto de escrita precisa ser valido
- escopo de leitura nao pode ampliar grants
- perda de grant pode invalidar o contexto atual

### Entidade: SharingPolicy

Descricao:
governa o compartilhamento de dados por dominio.

Campos principais:

- `policyId`
- `domainKey`
- `scopeType`
- `shareMode`
- `participantCompanyIds`
- `masterCompanyId`
- `status`
- `policyConfig`

Regras associadas:

- `NONE` e o padrao
- `masterCompanyId` e obrigatorio para `SINGLE_MASTER`
- compartilhamento transacional nao pode ser habilitado por conveniencia sem politica explicita

### Entidade: ConsolidationRun

Descricao:
representa uma execucao formal e auditavel de consolidacao multiempresa.

Campos principais:

- `runId`
- `participantCompanyIds`
- `participantEstablishmentIds`
- `periodStart`
- `periodEnd`
- `fiscalCalendarId`
- `currencyCode`
- `fxPolicy`
- `percentagePolicy`
- `eliminationMode`
- `status`
- `validationSummary`
- `resultSummary`
- `errorSummary`
- `requestedBy`
- `startedAt`
- `completedAt`
- `idempotencyKey`

Regras associadas:

- requer pre-validacao
- precisa de parametros completos
- deve suportar reprocessamento controlado
- deve manter rastreabilidade ate a origem

## 7. Modelo de dados Firestore

Padrao proposto:

```text
/tenants/{tenantId}/domains/governance/{collection}/{documentId}
```

### Collections

| Collection | Caminho | Finalidade | Documento pai | Subcollections |
| --- | --- | --- | --- | --- |
| `companies` | `/tenants/{tenantId}/domains/governance/companies/{companyId}` | persistir empresas | `governance` | `audit_refs` opcional |
| `establishments` | `/tenants/{tenantId}/domains/governance/establishments/{establishmentId}` | persistir matriz e filial | `governance` | `license_files` opcional |
| `user_scope_grants` | `/tenants/{tenantId}/domains/governance/user_scope_grants/{userId}` | resumo de grants e defaults | `governance` | `companies/{companyId}` e `companies/{companyId}/establishments/{establishmentId}` |
| `user_contexts` | `/tenants/{tenantId}/domains/governance/user_contexts/{userId}` | contexto operacional do usuario | `governance` | nenhuma |
| `sharing_policies` | `/tenants/{tenantId}/domains/governance/sharing_policies/{policyId}` | politicas de escopo e compartilhamento | `governance` | nenhuma |
| `consolidation_runs` | `/tenants/{tenantId}/domains/governance/consolidation_runs/{runId}` | runs formais de consolidacao | `governance` | `items/{itemId}`, `issues/{issueId}` |
| `operational_units` | `/tenants/{tenantId}/domains/governance/operational_units/{unitId}` | reserva para evolucao futura | `governance` | nenhuma |

### Metadados obrigatorios comuns

```json
{
  "tenantId": "tenant_123",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "createdBy": "user_123",
  "updatedAt": "2026-01-01T10:00:00.000Z",
  "updatedBy": "user_123",
  "deletedAt": null,
  "deletedBy": null,
  "version": 1,
  "status": "active",
  "auditRevision": 1,
  "lastIdempotencyKey": null
}
```

### Documento `companies/{companyId}`

| Campo | Tipo | Obrigatorio | Indexavel | Sensivel | Auditado | Descricao |
| --- | --- | --- | --- | --- | --- | --- |
| `companyId` | string | Sim | Sim | Nao | Sim | ID estavel |
| `tenantId` | string | Sim | Sim | Nao | Sim | tenant de ownership |
| `legalName` | string | Sim | Sim | Nao | Sim | razao social |
| `tradeName` | string \| null | Nao | Sim | Nao | Sim | nome fantasia |
| `legalNameNormalized` | string | Sim | Sim | Nao | Nao | busca por prefixo |
| `companyRootRegistration` | string | Sim | Sim | Nao | Sim | raiz cadastral |
| `countryCode` | string | Sim | Sim | Nao | Sim | pais |
| `legalNatureCode` | string | Sim | Sim | Nao | Sim | natureza juridica |
| `openingDate` | string | Sim | Sim | Nao | Sim | data ISO |
| `regimeTributario` | string | Sim | Sim | Nao | Sim | regime tributario |
| `defaultCurrency` | string | Sim | Sim | Nao | Sim | moeda funcional |
| `fiscalCalendarId` | string | Sim | Sim | Nao | Sim | calendario fiscal |
| `consolidationMode` | string | Sim | Sim | Nao | Sim | modo de consolidacao |
| `primaryEstablishmentId` | string \| null | Nao | Sim | Nao | Sim | matriz principal |
| `groupEconomicId` | string \| null | Nao | Sim | Nao | Sim | grupo economico opcional |
| `status` | string | Sim | Sim | Nao | Sim | estado logico |
| `version` | number | Sim | Nao | Nao | Sim | concorrencia otimista |

### Documento `establishments/{establishmentId}`

| Campo | Tipo | Obrigatorio | Indexavel | Sensivel | Auditado | Descricao |
| --- | --- | --- | --- | --- | --- | --- |
| `establishmentId` | string | Sim | Sim | Nao | Sim | ID estavel |
| `tenantId` | string | Sim | Sim | Nao | Sim | tenant |
| `companyId` | string | Sim | Sim | Nao | Sim | empresa pai |
| `establishmentType` | enum | Sim | Sim | Nao | Sim | `MATRIX` ou `BRANCH` |
| `isPrincipal` | boolean | Sim | Sim | Nao | Sim | matriz principal |
| `registrationNumber` | string | Sim | Sim | Nao | Sim | CNPJ ou registro |
| `registrationRoot` | string | Sim | Sim | Nao | Sim | raiz do registro |
| `establishmentOrder` | string | Sim | Sim | Nao | Sim | ordem da unidade |
| `legalNameAtEstablishment` | string | Sim | Sim | Nao | Sim | nome empresarial local |
| `tradeNameAtEstablishment` | string \| null | Nao | Sim | Nao | Sim | fantasia local |
| `cnaePrincipal` | string | Sim | Sim | Nao | Sim | CNAE principal |
| `cnaesSecundarios` | string[] | Nao | Nao | Nao | Sim | CNAEs secundarios |
| `address` | map | Sim | Nao | Nao | Sim | endereco estruturado |
| `localTaxRegistrations` | array | Nao | Nao | Sim | Sim | IE, IM e afins |
| `localLicenses` | array | Nao | Nao | Sim | Sim | licencas e metadados |
| `contactEmail` | string \| null | Nao | Sim | Sim | Sim | contato |
| `contactPhone` | string \| null | Nao | Nao | Sim | Sim | contato |
| `isAdministrative` | boolean | Nao | Sim | Nao | Sim | matriz administrativa |
| `status` | string | Sim | Sim | Nao | Sim | estado logico |
| `version` | number | Sim | Nao | Nao | Sim | concorrencia |

### Documento `user_scope_grants/{userId}`

| Campo | Tipo | Obrigatorio | Indexavel | Sensivel | Auditado | Descricao |
| --- | --- | --- | --- | --- | --- | --- |
| `userId` | string | Sim | Sim | Nao | Sim | usuario dono do grant |
| `tenantId` | string | Sim | Sim | Nao | Sim | tenant |
| `allowedCompanyIds` | string[] | Sim | Nao | Nao | Sim | resumo de grants por empresa |
| `allowedEstablishmentIds` | string[] | Nao | Nao | Nao | Sim | resumo de grants por filial |
| `defaultCompanyId` | string \| null | Nao | Sim | Nao | Sim | empresa default |
| `defaultEstablishmentId` | string \| null | Nao | Sim | Nao | Sim | estabelecimento default |
| `grantsVersion` | number | Sim | Nao | Nao | Sim | concorrencia |
| `readOnlyAllowed` | boolean | Sim | Sim | Nao | Sim | permite sessao sem escrita |

Subcollections:

- `companies/{companyId}`
- `companies/{companyId}/establishments/{establishmentId}`

### Documento `user_contexts/{userId}`

| Campo | Tipo | Obrigatorio | Indexavel | Sensivel | Auditado | Descricao |
| --- | --- | --- | --- | --- | --- | --- |
| `userId` | string | Sim | Sim | Nao | Sim | usuario |
| `tenantId` | string | Sim | Sim | Nao | Sim | tenant |
| `activeCompanyId` | string \| null | Nao | Sim | Nao | Sim | contexto de escrita |
| `activeEstablishmentId` | string \| null | Nao | Sim | Nao | Sim | escopo local de escrita |
| `selectedReadCompanyIds` | string[] | Nao | Nao | Nao | Sim | leitura consolidada |
| `selectedReadEstablishmentIds` | string[] | Nao | Nao | Nao | Sim | refinamento da leitura |
| `writeEnabled` | boolean | Sim | Sim | Nao | Sim | escrita liberada |
| `lastSwitchedAt` | timestamp | Sim | Sim | Nao | Sim | ultima troca |
| `contextVersion` | number | Sim | Nao | Nao | Sim | concorrencia |

### Documento `sharing_policies/{policyId}`

| Campo | Tipo | Obrigatorio | Indexavel | Sensivel | Auditado | Descricao |
| --- | --- | --- | --- | --- | --- | --- |
| `policyId` | string | Sim | Sim | Nao | Sim | ID da politica |
| `tenantId` | string | Sim | Sim | Nao | Sim | tenant |
| `domainKey` | string | Sim | Sim | Nao | Sim | dominio afetado |
| `scopeType` | enum | Sim | Sim | Nao | Sim | `GLOBAL`, `COMPANY`, `ESTABLISHMENT` |
| `shareMode` | enum | Sim | Sim | Nao | Sim | `NONE`, `SINGLE_MASTER`, `REPLICATED` |
| `participantCompanyIds` | string[] | Nao | Sim | Nao | Sim | empresas participantes |
| `masterCompanyId` | string \| null | Nao | Sim | Nao | Sim | obrigatorio em `SINGLE_MASTER` |
| `status` | enum | Sim | Sim | Nao | Sim | `draft`, `active`, `inactive` |
| `policyConfig` | map | Nao | Nao | Nao | Sim | parametros adicionais |

### Documento `consolidation_runs/{runId}`

| Campo | Tipo | Obrigatorio | Indexavel | Sensivel | Auditado | Descricao |
| --- | --- | --- | --- | --- | --- | --- |
| `runId` | string | Sim | Sim | Nao | Sim | ID da run |
| `tenantId` | string | Sim | Sim | Nao | Sim | tenant |
| `participantCompanyIds` | string[] | Sim | Sim | Nao | Sim | empresas participantes |
| `participantEstablishmentIds` | string[] | Nao | Sim | Nao | Sim | refinamento por estabelecimento |
| `periodStart` | string | Sim | Sim | Nao | Sim | inicio ISO |
| `periodEnd` | string | Sim | Sim | Nao | Sim | fim ISO |
| `fiscalCalendarId` | string | Sim | Sim | Nao | Sim | calendario fiscal |
| `currencyCode` | string | Sim | Sim | Nao | Sim | moeda alvo |
| `fxPolicy` | map | Sim | Nao | Nao | Sim | regra cambial |
| `percentagePolicy` | map | Sim | Nao | Nao | Sim | percentual de consolidacao |
| `eliminationMode` | string | Sim | Sim | Nao | Sim | tratamento de eliminacoes |
| `status` | enum | Sim | Sim | Nao | Sim | estado da run |
| `validationSummary` | map | Nao | Nao | Nao | Sim | pre-checagens |
| `resultSummary` | map | Nao | Nao | Nao | Sim | resultado final |
| `errorSummary` | map \| null | Nao | Nao | Nao | Sim | erro controlado |
| `requestedBy` | string | Sim | Sim | Nao | Sim | solicitante |
| `startedAt` | timestamp \| null | Nao | Sim | Nao | Sim | inicio do processamento |
| `completedAt` | timestamp \| null | Nao | Sim | Nao | Sim | fim do processamento |
| `idempotencyKey` | string | Sim | Sim | Nao | Sim | deduplicacao |

### IDs sugeridos

- `companyId`: `cmp_{ulid}`
- `establishmentId`: `est_{ulid}`
- `policyId`: `shp_{ulid}`
- `runId`: `crn_{ulid}`
- `issueId`: `cri_{ulid}`
- `documentId` de grants e contexto: `userId`

## 8. Indices e consultas

| Consulta | Filtros | Ordenacao | Paginacao | Indice necessario | Observacoes |
| --- | --- | --- | --- | --- | --- |
| Listar empresas | `status`, `countryCode`, `regimeTributario` | `legalNameNormalized asc` | cursor | composto | busca por prefixo normalizado |
| Validar duplicidade de empresa | `companyRootRegistration`, `countryCode` | nenhuma | nao | simples | exata por tenant |
| Listar estabelecimentos por empresa | `companyId`, `status`, `establishmentType` | `legalNameAtEstablishment asc` | cursor | composto | usado em detalhe e cadastro |
| Validar matriz principal ativa | `companyId`, `isPrincipal=true`, `status` | nenhuma | nao | composto | precisa ser combinado com validacao transacional |
| Buscar estabelecimento por registro | `registrationNumber` | nenhuma | nao | simples | validacao de unicidade |
| Carregar grants de usuario | `userId` | nenhuma | nao | simples | leitura de documento + subcollections |
| Carregar contexto de usuario | `userId` | nenhuma | nao | simples | bootstrap de sessao |
| Listar politicas por dominio | `domainKey`, `status` | `updatedAt desc` | cursor | composto | area avancada |
| Listar runs de consolidacao | `status`, `requestedBy`, `periodStart`, `periodEnd` | `createdAt desc` | cursor | composto | monitoramento |
| Consultar runs por empresa participante | `participantCompanyIds array-contains` | `createdAt desc` | cursor | composto | usar com cuidado |
| Ler consolidado por empresa | `selectedReadCompanyIds`, `periodo`, `dominio` | configuravel | cursor | depende do read model | nao fazer fan-out irrestrito |
| Listar auditoria da entidade | `entityType`, `entityId` | `timestamp desc` | cursor | composto | se auditoria ficar em colecao dedicada |

Consultas obrigatorias para UX e regras:

- lista de empresas
- detalhe da empresa
- lista de estabelecimentos da empresa
- detalhe do estabelecimento
- grants por usuario
- contexto do usuario
- visao consolidada paginada
- runs de consolidacao
- divergencias de uma run
- validacao de duplicidade por registro

## 9. Contratos compartilhados

Estrutura sugerida:

```text
/packages/shared_contracts/src/v1/governance/
  common.metadata.types.ts
  common.enums.ts
  companies.types.ts
  companies.schemas.ts
  establishments.types.ts
  establishments.schemas.ts
  grants.types.ts
  grants.schemas.ts
  contexts.types.ts
  contexts.schemas.ts
  sharing-policies.types.ts
  sharing-policies.schemas.ts
  consolidation.types.ts
  consolidation.schemas.ts
  permissions.ts
  errors.ts
  state-machine.ts
  index.ts
```

| Arquivo | Responsabilidade | Conteudo esperado |
| --- | --- | --- |
| `common.metadata.types.ts` | metadados comuns | `TenantScoped`, `Auditable`, `Versioned`, `SoftDeletable` |
| `common.enums.ts` | enums do dominio | tipos, status, scope e share modes |
| `companies.types.ts` | DTOs e tipos de empresa | `Company`, `CreateCompanyRequest`, `UpdateCompanyRequest`, `CompanyListItem` |
| `companies.schemas.ts` | schemas Zod de empresa | create, update, list, detail |
| `establishments.types.ts` | DTOs e tipos de estabelecimento | `Establishment`, requests e filtros |
| `establishments.schemas.ts` | validacoes de estabelecimento | create, update, list |
| `grants.types.ts` | grants por escopo | `UserScopeGrant`, `GrantCompany`, `GrantEstablishment` |
| `grants.schemas.ts` | validacoes de grants | upsert, defaults, queries |
| `contexts.types.ts` | contexto operacional | `UserContext`, `SwitchContextRequest`, `AccessibleScopeSummary` |
| `contexts.schemas.ts` | validacao de contexto | switch e read-only |
| `sharing-policies.types.ts` | politicas por dominio | `SharingPolicy` e responses |
| `sharing-policies.schemas.ts` | validacoes de politicas | create, update, activate |
| `consolidation.types.ts` | contratos de consolidacao | `ConsolidationRun`, `ConsolidationIssue`, `ConsolidationItem` |
| `consolidation.schemas.ts` | validacoes de consolidacao | create, list, reprocess |
| `permissions.ts` | permissoes do dominio | constantes `governance.*`, `reporting.*`, `audit.read` |
| `errors.ts` | codigos de erro | enum ou union dos erros padronizados |
| `state-machine.ts` | estados permitidos | transicoes de `Company`, `Establishment`, `ConsolidationRun` |
| `index.ts` | barrel file | reexports do dominio |

### Versionamento explicito

- todos os contratos ficam em `v1`
- qualquer breaking change exige `v2`
- campos opcionais novos podem entrar sem quebrar `v1`

## 10. Schemas Zod e validacoes

| Schema | Finalidade | Campos | Regras principais |
| --- | --- | --- | --- |
| `CreateCompanyRequestSchema` | criar empresa | dados juridicos e tributarios | obrigatorios, catalogos validos, raiz unica |
| `UpdateCompanyRequestSchema` | atualizar empresa | campos mutaveis | sem trocar ownership ou tenant |
| `ListCompaniesQuerySchema` | listar empresas | filtros e pagina | pagina limitada e filtros controlados |
| `CreateEstablishmentRequestSchema` | criar estabelecimento | company, tipo, registro, CNAE, endereco | tipo explicito, matriz unica, empresa valida |
| `UpdateEstablishmentRequestSchema` | atualizar estabelecimento | campos mutaveis | sem migracao de empresa no V1 |
| `UpsertUserScopeGrantRequestSchema` | salvar grants | empresas, filiais, defaults | coerencia hierarquica e defaults validos |
| `SwitchOperationalContextRequestSchema` | trocar contexto | leitura e escrita | escopo pedido dentro do grant |
| `CreateSharingPolicyRequestSchema` | criar politica | dominio, scopeType, shareMode | master company e participantes coerentes |
| `CreateConsolidationRunRequestSchema` | criar run | participantes, periodo, moeda e regras | minimo de empresas, periodo valido, pre-checagens |
| `ListConsolidationRunsQuerySchema` | listar runs | filtros e pagina | limites de consulta |
| `ReprocessConsolidationRunRequestSchema` | reprocessar run | justificativa | status elegivel e justificativa obrigatoria |

### Schema: `CreateCompanyRequestSchema`

Campos:

- `legalName`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: `trim`, min 3, max 200
  - mensagem de erro: `Informe a razao social.`
- `tradeName`
  - tipo: `string`
  - obrigatorio: nao
  - validacoes: max 120
  - mensagem de erro: `Nome fantasia invalido.`
- `companyRootRegistration`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: formato por pais, normalizacao
  - mensagem de erro: `Identificador raiz invalido.`
- `countryCode`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: ISO alpha-2
  - mensagem de erro: `Pais invalido.`
- `legalNatureCode`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: deve existir em catalogo
  - mensagem de erro: `Natureza juridica invalida.`
- `openingDate`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: data ISO, nao futura
  - mensagem de erro: `Data de abertura invalida.`
- `regimeTributario`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: valor permitido no catalogo
  - mensagem de erro: `Selecione um regime tributario valido.`
- `defaultCurrency`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: ISO 4217
  - mensagem de erro: `Moeda invalida.`
- `fiscalCalendarId`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: calendario existente
  - mensagem de erro: `Calendario fiscal invalido.`
- `consolidationMode`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: enum/catalogo
  - mensagem de erro: `Modo de consolidacao invalido.`

### Schema: `CreateEstablishmentRequestSchema`

Campos:

- `companyId`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: empresa existente e do mesmo tenant
  - mensagem de erro: `Empresa invalida.`
- `establishmentType`
  - tipo: `enum`
  - obrigatorio: sim
  - validacoes: `MATRIX` ou `BRANCH`
  - mensagem de erro: `Defina explicitamente se o estabelecimento e matriz ou filial.`
- `isPrincipal`
  - tipo: `boolean`
  - obrigatorio: sim
  - validacoes: coerente com o tipo
  - mensagem de erro: `Ja existe uma matriz principal ativa.` ou `Filial nao pode ser principal.`
- `registrationNumber`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: formato por pais, normalizacao
  - mensagem de erro: `Informe um registro valido.`
- `registrationRoot`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: coerencia com a empresa
  - mensagem de erro: `Raiz do registro inconsistente com a empresa.`
- `establishmentOrder`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: max 20
  - mensagem de erro: `Ordem do estabelecimento invalida.`
- `legalNameAtEstablishment`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: min 3, max 200
  - mensagem de erro: `Nome empresarial invalido.`
- `cnaePrincipal`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: catalogo valido
  - mensagem de erro: `Informe um CNAE principal valido.`
- `cnaesSecundarios`
  - tipo: `string[]`
  - obrigatorio: nao
  - validacoes: sem duplicidade
  - mensagem de erro: `CNAEs secundarios invalidos.`
- `address`
  - tipo: `object`
  - obrigatorio: sim
  - validacoes: campos minimos por pais
  - mensagem de erro: `Endereco invalido.`

### Schema: `UpsertUserScopeGrantRequestSchema`

Campos:

- `userId`
  - tipo: `string`
  - obrigatorio: sim
- `companies`
  - tipo: `array`
  - obrigatorio: sim
  - validacoes: minimo 1
- `companies[].companyId`
  - tipo: `string`
  - obrigatorio: sim
- `companies[].establishmentIds`
  - tipo: `string[]`
  - obrigatorio: nao
  - validacoes: cada estabelecimento precisa pertencer a empresa selecionada
- `defaultCompanyId`
  - tipo: `string`
  - obrigatorio: nao
  - validacoes: deve existir entre as empresas concedidas
- `defaultEstablishmentId`
  - tipo: `string`
  - obrigatorio: nao
  - validacoes: deve existir no grant da empresa default
- `readOnlyAllowed`
  - tipo: `boolean`
  - obrigatorio: sim

### Schema: `SwitchOperationalContextRequestSchema`

Campos:

- `activeCompanyId`
  - tipo: `string`
  - obrigatorio: condicional
  - validacoes: obrigatorio se `writeEnabled=true`
- `activeEstablishmentId`
  - tipo: `string`
  - obrigatorio: condicional
  - validacoes: precisa pertencer a `activeCompanyId`
- `selectedReadCompanyIds`
  - tipo: `string[]`
  - obrigatorio: nao
  - validacoes: subconjunto do grant
- `selectedReadEstablishmentIds`
  - tipo: `string[]`
  - obrigatorio: nao
  - validacoes: subconjunto do grant
- `writeEnabled`
  - tipo: `boolean`
  - obrigatorio: sim

### Schema: `CreateConsolidationRunRequestSchema`

Campos:

- `participantCompanyIds`
  - tipo: `string[]`
  - obrigatorio: sim
  - validacoes: minimo 2 empresas
- `participantEstablishmentIds`
  - tipo: `string[]`
  - obrigatorio: nao
- `periodStart`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: data ISO
- `periodEnd`
  - tipo: `string`
  - obrigatorio: sim
  - validacoes: maior ou igual a `periodStart`
- `fiscalCalendarId`
  - tipo: `string`
  - obrigatorio: sim
- `currencyCode`
  - tipo: `string`
  - obrigatorio: sim
- `fxPolicy`
  - tipo: `object`
  - obrigatorio: sim
- `percentagePolicy`
  - tipo: `object`
  - obrigatorio: sim
- `eliminationMode`
  - tipo: `string`
  - obrigatorio: sim
- `reprocessOfRunId`
  - tipo: `string`
  - obrigatorio: nao

## 11. Endpoints REST

| Metodo | Rota | Descricao | Permissao | Idempotente | Request | Response | Erros |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `GET` | `/v1/governance/companies` | listar empresas | `governance.company.read` | sim | query filtros | lista paginada | `FORBIDDEN`, `VALIDATION_ERROR` |
| `POST` | `/v1/governance/companies` | criar empresa | `governance.company.create` | com chave | body create | empresa criada | `DUPLICATE_RECORD`, `VALIDATION_ERROR` |
| `GET` | `/v1/governance/companies/:companyId` | detalhar empresa | `governance.company.read` | sim | path | detalhe | `NOT_FOUND`, `COMPANY_ACCESS_DENIED` |
| `PATCH` | `/v1/governance/companies/:companyId` | atualizar empresa | `governance.company.update` | com chave | body parcial + version | detalhe atualizado | `VERSION_CONFLICT`, `VALIDATION_ERROR` |
| `POST` | `/v1/governance/companies/:companyId/activate` | ativar empresa | `governance.company.activate` | com chave | body version | estado atualizado | `INVALID_STATUS_TRANSITION` |
| `POST` | `/v1/governance/companies/:companyId/inactivate` | inativar empresa | `governance.company.inactivate` | com chave | body version + justification | estado atualizado | `INVALID_STATUS_TRANSITION` |
| `POST` | `/v1/governance/companies/:companyId/archive` | arquivar empresa | `governance.company.archive` | com chave | body version + justification | estado atualizado | `ARCHIVE_BLOCKED` |
| `GET` | `/v1/governance/companies/:companyId/audit` | auditoria da empresa | `audit.read` | sim | query pagina | eventos | `FORBIDDEN` |
| `GET` | `/v1/governance/establishments` | listar estabelecimentos | `governance.establishment.read` | sim | query filtros | lista paginada | `VALIDATION_ERROR` |
| `POST` | `/v1/governance/establishments` | criar estabelecimento | `governance.establishment.create` | com chave | body create | estabelecimento criado | `COMPANY_ALREADY_HAS_PRIMARY_MATRIX`, `VALIDATION_ERROR` |
| `GET` | `/v1/governance/establishments/:establishmentId` | detalhar estabelecimento | `governance.establishment.read` | sim | path | detalhe | `NOT_FOUND`, `BRANCH_ACCESS_DENIED` |
| `PATCH` | `/v1/governance/establishments/:establishmentId` | atualizar estabelecimento | `governance.establishment.update` | com chave | body parcial + version | atualizado | `VERSION_CONFLICT`, `INVALID_ESTABLISHMENT_TYPE` |
| `POST` | `/v1/governance/establishments/:establishmentId/activate` | ativar estabelecimento | `governance.establishment.activate` | com chave | body version | estado atualizado | `INVALID_STATUS_TRANSITION` |
| `POST` | `/v1/governance/establishments/:establishmentId/inactivate` | inativar estabelecimento | `governance.establishment.inactivate` | com chave | body version + justification | estado atualizado | `INVALID_STATUS_TRANSITION` |
| `POST` | `/v1/governance/establishments/:establishmentId/archive` | arquivar estabelecimento | `governance.establishment.archive` | com chave | body version + justification | estado atualizado | `ARCHIVE_BLOCKED` |
| `GET` | `/v1/governance/users/:userId/scope-grants` | obter grants | `governance.user_scope.manage` | sim | path | grants | `NOT_FOUND`, `FORBIDDEN` |
| `PUT` | `/v1/governance/users/:userId/scope-grants` | substituir grants | `governance.user_scope.manage` | semanticamente sim | body completo | grants atualizados | `GRANT_SCOPE_INCONSISTENT`, `VALIDATION_ERROR` |
| `GET` | `/v1/governance/me/accessible-scopes` | escopos acessiveis | autenticado | sim | nenhuma | resumo de grants | `UNAUTHORIZED` |
| `GET` | `/v1/governance/me/context` | contexto atual | autenticado | sim | nenhuma | contexto | `UNAUTHORIZED` |
| `POST` | `/v1/governance/me/context/switch` | trocar contexto | `governance.context.switch` | com chave recomendada | body switch | contexto atualizado | `CONTEXT_SCOPE_INVALID` |
| `GET` | `/v1/governance/sharing-policies` | listar politicas | `governance.sharing.policy.manage` | sim | query | lista | `FORBIDDEN` |
| `POST` | `/v1/governance/sharing-policies` | criar politica | `governance.sharing.policy.manage` | com chave | body create | politica criada | `SHARING_POLICY_INVALID` |
| `PATCH` | `/v1/governance/sharing-policies/:policyId` | atualizar politica | `governance.sharing.policy.manage` | com chave | body parcial + version | politica atualizada | `VERSION_CONFLICT` |
| `POST` | `/v1/governance/sharing-policies/:policyId/activate` | ativar politica | `governance.sharing.policy.manage` | com chave | body version | politica ativa | `INVALID_STATUS_TRANSITION` |
| `GET` | `/v1/governance/consolidated/overview` | resumo consolidado | `reporting.consolidated.read` | sim | query escopo/perdiodo | resumo | `FORBIDDEN`, `VALIDATION_ERROR` |
| `GET` | `/v1/governance/consolidated/companies` | consolidado por empresa | `reporting.consolidated.read` | sim | query escopo/perdiodo | lista paginada | `FORBIDDEN` |
| `GET` | `/v1/governance/consolidation-runs` | listar runs | `governance.consolidation.read` | sim | query | lista paginada | `FORBIDDEN` |
| `POST` | `/v1/governance/consolidation-runs` | criar run | `governance.consolidation.run` | com chave | body create | run criada | `CONSOLIDATION_PARAMETERS_INCOMPLETE`, `CONSOLIDATION_MAPPING_MISSING` |
| `GET` | `/v1/governance/consolidation-runs/:runId` | detalhar run | `governance.consolidation.read` | sim | path | detalhe | `NOT_FOUND`, `FORBIDDEN` |
| `GET` | `/v1/governance/consolidation-runs/:runId/issues` | listar divergencias | `governance.consolidation.read` | sim | path/query | issues | `NOT_FOUND` |
| `POST` | `/v1/governance/consolidation-runs/:runId/reprocess` | reprocessar run | `governance.consolidation.reprocess` | com chave | body justificativa | nova execucao ou reabertura controlada | `INVALID_STATUS_TRANSITION` |
| `GET` | `/v1/governance/consolidation-runs/:runId/audit` | auditoria da run | `audit.read` | sim | query pagina | eventos | `FORBIDDEN` |

### Regras por endpoint

- mutacoes em registros existentes exigem `version`
- `PUT /scope-grants` substitui o estado inteiro do grant
- `POST /me/context/switch` altera apenas `UserContext`
- `GET /consolidated/*` nunca amplia grants
- exclusao fisica nao e exposta; `archive` substitui `DELETE`

## 12. Envelopes de resposta

### Sucesso

```json
{
  "success": true,
  "data": {},
  "meta": {
    "correlationId": "corr_123",
    "timestamp": "2026-01-01T10:00:00.000Z"
  }
}
```

### Erro

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Registro nao encontrado.",
    "details": {}
  },
  "meta": {
    "correlationId": "corr_123",
    "timestamp": "2026-01-01T10:00:00.000Z"
  }
}
```

### Meta adicional recomendada

- `page`
- `pageSize`
- `nextCursor`
- `idempotencyReplay`

## 13. Codigos de erro

| Codigo | HTTP Status | Mensagem ao usuario | Causa tecnica | Quando ocorre |
| --- | --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Existem campos invalidos. | schema falhou | payload ou query invalida |
| `UNAUTHORIZED` | 401 | Sessao invalida ou expirada. | token ausente ou invalido | autenticacao falhou |
| `FORBIDDEN` | 403 | Voce nao possui permissao para esta acao. | RBAC negou | acao sem permissao |
| `TENANT_ACCESS_DENIED` | 403 | Acesso negado ao tenant. | tenant divergente | acesso horizontal cross-tenant |
| `COMPANY_ACCESS_DENIED` | 403 | Voce nao possui acesso a esta empresa. | grant ausente | empresa fora do escopo |
| `BRANCH_ACCESS_DENIED` | 403 | Voce nao possui acesso a este estabelecimento. | grant ausente | filial fora do escopo |
| `CONTEXT_SCOPE_INVALID` | 403 | O contexto informado nao e valido para sua sessao. | contexto fora do grant | troca de contexto invalida |
| `NOT_FOUND` | 404 | Registro nao encontrado. | ID inexistente | leitura por identificador |
| `DUPLICATE_RECORD` | 409 | Ja existe um registro com estes dados. | unicidade violada | empresa ou estabelecimento duplicado |
| `COMPANY_ALREADY_HAS_PRIMARY_MATRIX` | 409 | A empresa ja possui uma matriz principal ativa. | regra estrutural | segunda matriz principal |
| `GRANT_SCOPE_INCONSISTENT` | 409 | O estabelecimento nao pertence a empresa concedida. | grant incoerente | grants invalidos |
| `INVALID_ESTABLISHMENT_TYPE` | 422 | Defina explicitamente se o estabelecimento e matriz ou filial. | enum ou combinacao invalida | create/update estabelecimento |
| `INVALID_STATUS_TRANSITION` | 422 | A mudanca de status nao e permitida. | maquina de estados | transicao invalida |
| `VERSION_CONFLICT` | 409 | Este registro foi alterado por outra pessoa. | concorrencia otimista | `version` divergente |
| `ARCHIVE_BLOCKED` | 409 | Este registro possui dependencias e nao pode ser arquivado agora. | dependencias bloqueantes | arquivamento proibido |
| `IDEMPOTENCY_CONFLICT` | 409 | A chave de idempotencia ja foi usada com outra operacao. | fingerprint divergente | replay inconsistente |
| `CONSOLIDATION_PARAMETERS_INCOMPLETE` | 422 | Faltam parametros obrigatorios para a consolidacao. | pre-validacao falhou | criacao de run |
| `CONSOLIDATION_MAPPING_MISSING` | 422 | Existem mapeamentos pendentes para consolidar. | contas, FX, calendario ou percentual pendente | criacao de run |
| `CONSOLIDATION_RUN_IN_PROGRESS` | 409 | Ja existe uma execucao equivalente em andamento. | deduplicacao/processamento paralelo | criacao de run duplicada |
| `INTEGRATION_ERROR` | 502 | Nao foi possivel validar dependencias externas agora. | catalogo ou servico externo falhou | integracao indisponivel |
| `RATE_LIMIT_EXCEEDED` | 429 | Muitas tentativas em pouco tempo. | rate limit | abuso |
| `INTERNAL_ERROR` | 500 | Ocorreu um erro interno. | excecao nao tratada | fallback |

## 14. Autenticacao e autorizacao

### Autenticacao

- token Firebase Auth obrigatorio em todos os endpoints protegidos
- validacao server-side com Firebase Admin SDK
- extracao de `uid`, `tenantId`, `roles` e `permissions`
- `tenantId` do token deve bater com o tenant do recurso

### Autorizacao

- RBAC por permissao
- ABAC por tenant, empresa, estabelecimento, status e grants
- `default deny`
- nenhum grant do frontend e confiado sem revalidacao backend

| Acao | Permissao necessaria | Escopo | Regra de autorizacao |
| --- | --- | --- | --- |
| Listar empresas | `governance.company.read` | tenant ou subset permitido | admin pode ver tenant; demais veem escopo autorizado |
| Criar empresa | `governance.company.create` | tenant | nao exige contexto de escrita ativo |
| Atualizar empresa | `governance.company.update` | empresa alvo | empresa deve pertencer ao tenant e usuario deve ter permissao |
| Criar estabelecimento | `governance.establishment.create` | empresa alvo | empresa ativa, no tenant e autorizada |
| Atualizar estabelecimento | `governance.establishment.update` | estabelecimento alvo | grant e permissao validos |
| Gerir grants | `governance.user_scope.manage` | tenant | somente perfis elevados |
| Trocar contexto | `governance.context.switch` | escopos proprios | pedido precisa ser subconjunto do grant |
| Ler consolidado | `reporting.consolidated.read` | subset autorizado | query nao pode ampliar grants |
| Criar politica de compartilhamento | `governance.sharing.policy.manage` | tenant | somente perfis elevados |
| Criar consolidacao | `governance.consolidation.run` | subset autorizado | participantes autorizados e ativos |
| Reprocessar consolidacao | `governance.consolidation.reprocess` | run alvo | status elegivel e justificativa obrigatoria |
| Ler auditoria | `audit.read` | tenant ou subset | conforme escopo permitido |

### Excecoes controladas

- acoes administrativas de nivel tenant, como criar empresa, nao dependem de `activeCompanyId`
- sessao somente leitura pode existir, mas qualquer mutacao falha sem contexto de escrita valido

## 15. Regras de negocio no backend

| Regra funcional | Regra backend | Onde validar | Erro esperado |
| --- | --- | --- | --- |
| Isolamento por tenant | toda query e escrita usam `tenantId` do token | middleware + repository | `TENANT_ACCESS_DENIED` |
| Empresa e a entidade legal | `Company` e a raiz juridica do dominio | service | `VALIDATION_ERROR` |
| Matriz e filial sao estabelecimentos | `establishmentType` e obrigatorio | Zod + service | `INVALID_ESTABLISHMENT_TYPE` |
| So pode existir uma matriz principal ativa | checagem transacional por `companyId` | repository + service | `COMPANY_ALREADY_HAS_PRIMARY_MATRIX` |
| Nao inferir matriz apenas por registro | tipo vem do payload e e obrigatorio | Zod + service | `INVALID_ESTABLISHMENT_TYPE` |
| Escrita exige contexto unico | mutacao sem contexto valido e negada | middleware + service | `CONTEXT_SCOPE_INVALID` |
| Leitura multiempresa nao altera escrita | escopo de leitura persiste separado do contexto de escrita | service | `VALIDATION_ERROR` |
| Grants precisam ser coerentes | estabelecimento precisa pertencer a empresa concedida | service | `GRANT_SCOPE_INCONSISTENT` |
| Compartilhamento e excecao governada | `shareMode` default e `NONE` | service | `SHARING_POLICY_INVALID` |
| Consolidacao exige parametros completos | run sem pre-checagem nao e processada | service + job | `CONSOLIDATION_PARAMETERS_INCOMPLETE` |
| Intercompany e explicito | transacao cross-company exige fluxo proprio | service | `FORBIDDEN` |
| Filial pertence a uma empresa | `companyId` nao muda sem migracao formal | service + repository | `VALIDATION_ERROR` |
| Regime tributario valido | valor deve existir em catalogo | service/integration | `VALIDATION_ERROR` |
| CNAE principal e obrigatorio | estabelecimento sem CNAE principal e invalido | Zod + service | `VALIDATION_ERROR` |
| Exclusao fisica com historico e proibida | usar `archive` ou `inactive` | service | `ARCHIVE_BLOCKED` |
| Auditoria de acoes criticas e obrigatoria | acao critica so conclui com evento auditavel | service + audit writer | `INTERNAL_ERROR` |

## 16. Maquina de estados

### `Company`

| Estado atual | Acao | Proximo estado | Permissao | Condicoes | Erro se invalido |
| --- | --- | --- | --- | --- | --- |
| `draft` | `update` | `draft` | `governance.company.update` | version valida | `VERSION_CONFLICT` |
| `draft` | `activate` | `active` | `governance.company.activate` | dados minimos validos e matriz principal definida | `VALIDATION_ERROR` |
| `active` | `inactivate` | `inactive` | `governance.company.inactivate` | justificativa obrigatoria | `INVALID_STATUS_TRANSITION` |
| `inactive` | `activate` | `active` | `governance.company.activate` | sem bloqueios estruturais | `INVALID_STATUS_TRANSITION` |
| `inactive` | `archive` | `archived` | `governance.company.archive` | sem dependencias bloqueantes | `ARCHIVE_BLOCKED` |
| `archived` | qualquer mutacao | nenhum | nenhuma | estado terminal | `INVALID_STATUS_TRANSITION` |

### `Establishment`

| Estado atual | Acao | Proximo estado | Permissao | Condicoes | Erro se invalido |
| --- | --- | --- | --- | --- | --- |
| `draft` | `update` | `draft` | `governance.establishment.update` | version valida | `VERSION_CONFLICT` |
| `draft` | `activate` | `active` | `governance.establishment.activate` | empresa valida, CNAE valido e regras de matriz respeitadas | `VALIDATION_ERROR` |
| `active` | `inactivate` | `inactive` | `governance.establishment.inactivate` | justificativa obrigatoria | `INVALID_STATUS_TRANSITION` |
| `inactive` | `activate` | `active` | `governance.establishment.activate` | sem conflito de matriz principal | `COMPANY_ALREADY_HAS_PRIMARY_MATRIX` |
| `inactive` | `archive` | `archived` | `governance.establishment.archive` | sem dependencias ativas | `ARCHIVE_BLOCKED` |
| `archived` | qualquer mutacao | nenhum | nenhuma | estado terminal | `INVALID_STATUS_TRANSITION` |

### `ConsolidationRun`

| Estado atual | Acao | Proximo estado | Permissao | Condicoes | Erro se invalido |
| --- | --- | --- | --- | --- | --- |
| `draft` | `submit` | `queued` | `governance.consolidation.run` | parametros completos | `CONSOLIDATION_PARAMETERS_INCOMPLETE` |
| `queued` | `preValidate` | `pre_validating` | sistema | job iniciado | `INVALID_STATUS_TRANSITION` |
| `pre_validating` | `block` | `blocked` | sistema | pendencias bloqueantes | `CONSOLIDATION_MAPPING_MISSING` |
| `pre_validating` | `process` | `processing` | sistema | pre-checagens aprovadas | `INVALID_STATUS_TRANSITION` |
| `processing` | `complete` | `completed` | sistema | sem divergencias criticas | `INVALID_STATUS_TRANSITION` |
| `processing` | `completeWithDivergences` | `completed_with_divergences` | sistema | divergencias nao bloqueantes | `INVALID_STATUS_TRANSITION` |
| `processing` | `fail` | `failed` | sistema | erro tecnico | `INTERNAL_ERROR` |
| `blocked` | `reprocess` | `queued` | `governance.consolidation.reprocess` | justificativa e pendencias resolvidas | `INVALID_STATUS_TRANSITION` |
| `failed` | `reprocess` | `queued` | `governance.consolidation.reprocess` | justificativa | `INVALID_STATUS_TRANSITION` |

## 17. Idempotencia

| Operacao | Exige idempotencia | Chave sugerida | Janela de validade | Comportamento em repeticao |
| --- | --- | --- | --- | --- |
| Criar empresa | Sim | `tenantId:userId:create-company:{clientKey}` | 24h | retorna a mesma resposta |
| Criar estabelecimento | Sim | `tenantId:userId:create-establishment:{clientKey}` | 24h | nao duplica registro |
| Ativar/inativar/arquivar empresa | Sim | `tenantId:userId:company-transition:{companyId}:{clientKey}` | 24h | nao duplica auditoria |
| Ativar/inativar/arquivar estabelecimento | Sim | `tenantId:userId:establishment-transition:{id}:{clientKey}` | 24h | replay consistente |
| Salvar grants | Recomendado | `tenantId:userId:update-grants:{targetUserId}:{clientKey}` | 12h | evita repeticao de side effects |
| Trocar contexto | Recomendado | `tenantId:userId:switch-context:{clientKey}` | 1h | retorna o estado final aplicado |
| Criar run de consolidacao | Sim | `tenantId:userId:create-run:{clientKey}` | 48h | impede runs duplicadas |
| Reprocessar run | Sim | `tenantId:userId:reprocess-run:{runId}:{clientKey}` | 24h | reexecucao segura |

Regra obrigatoria:

- mesma chave com payload diferente retorna `IDEMPOTENCY_CONFLICT`

## 18. Auditoria

| Evento | Quando auditar | Dados minimos | Sensibilidade | Retencao |
| --- | --- | --- | --- | --- |
| `company.created` | criacao de empresa | tenantId, userId, entityId, payload resumido | Alta | conforme politica corporativa |
| `company.updated` | atualizacao de empresa | before, after, version, correlationId | Alta | conforme politica corporativa |
| `company.status_changed` | ativar, inativar ou arquivar | status anterior, novo, justificativa | Alta | conforme politica corporativa |
| `establishment.created` | criacao de estabelecimento | companyId, entityId, type | Alta | conforme politica corporativa |
| `establishment.updated` | atualizacao | before, after | Alta | conforme politica corporativa |
| `grant.updated` | alteracao de grants | targetUserId, before, after | Alta | conforme politica corporativa |
| `context.switched` | troca de contexto | contexto anterior e novo | Media | conforme politica corporativa |
| `access.denied` | negacao de acesso | userId, acao, alvo, motivo | Alta | conforme politica corporativa |
| `sharing_policy.updated` | alteracao de politica | policyId, before, after | Alta | conforme politica corporativa |
| `consolidation.run.created` | criacao da run | runId, empresas, periodo, parametros resumidos | Alta | conforme politica corporativa |
| `consolidation.run.completed` | finalizacao | status, metricas, divergencias | Alta | conforme politica corporativa |
| `consolidation.run.reprocessed` | reprocessamento | run original, motivo, nova execucao | Alta | conforme politica corporativa |

Justificativa obrigatoria:

- inativar empresa
- arquivar empresa
- inativar estabelecimento
- arquivar estabelecimento
- reducao ampla de grants
- reprocessamento de consolidacao

## 19. Logs e observabilidade

| Evento tecnico | Nivel | Dados no log | Observacoes |
| --- | --- | --- | --- |
| request recebida | `info` | method, route, correlationId, userId, tenantId | sem payload sensivel |
| autenticacao falhou | `warn` | route, ip, userAgent, motivo | nao logar token |
| autorizacao negada | `warn` | route, userId, tenantId, companyId, establishmentId, permission | importante para rastreio |
| validacao falhou | `info` | route, schema, campos invalidos resumidos | sem valores sensiveis |
| duplicidade detectada | `info` | entityType, normalizedKey | suporte e diagnostico |
| transicao invalida | `warn` | entityId, currentStatus, action | monitora uso incorreto |
| empresa criada | `info` | companyId, userId, tenantId | correlationId obrigatorio |
| grant atualizado | `info` | targetUserId, changedScopesCount | sem detalhes sensiveis |
| contexto trocado | `info` | activeCompanyId, activeEstablishmentId, writeEnabled | evento de sessao |
| run enfileirada | `info` | runId, participantCount, period | consolidacao formal |
| run com divergencia | `warn` | runId, issueCount, blockingCount | alerta operacional |
| excecao nao tratada | `error` | route, correlationId, stack sanitizada | nao expor ao cliente |

### Campos obrigatorios de log

- `correlationId`
- `requestId`
- `tenantId`
- `userId`
- `companyId`, se houver
- `establishmentId`, se houver
- `durationMs`
- `httpStatus`

### Metricas recomendadas

- latencia por rota
- taxa de 4xx e 5xx
- total de negacoes por grant
- total de trocas de contexto
- runs de consolidacao por status
- taxa de reprocessamento

## 20. Seguranca

- sanitizar e normalizar entradas antes da persistencia
- nunca confiar em `tenantId`, `createdBy`, `updatedBy`, `status` ou campos internos vindos do cliente
- bloquear acesso horizontal entre tenants
- bloquear acesso horizontal entre empresas e filiais
- validar permissao no backend para toda leitura sensivel e toda mutacao
- usar Firebase Rules apenas como defesa adicional, nao como camada principal
- aplicar rate limit em endpoints administrativos e de consolidacao
- nao expor stack trace no envelope de erro
- mascarar dados sensiveis em logs e exportacoes quando aplicavel
- validar tipo, tamanho e ownership de anexos
- impedir alteracao indevida de `companyId`, `tenantId`, `version` e ownerships internos
- aplicar soft delete e historico em vez de exclusao fisica de registros estruturais

## 21. Firebase Rules

Premissa segura para FG-001:

- colecoes centrais de governanca nao devem ser mutaveis diretamente pelo app Flutter;
- Node backend com Admin SDK e o escritor autorizado;
- Rules existem como defesa adicional.

| Recurso | Regra necessaria | Condicao | Observacao |
| --- | --- | --- | --- |
| `companies` | negar leitura e escrita direta do cliente | `false` | acesso via API |
| `establishments` | negar leitura e escrita direta do cliente | `false` | acesso via API |
| `user_scope_grants` | negar leitura e escrita direta do cliente | `false` | grants somente via API |
| `user_contexts` | leitura opcional do proprio usuario; escrita negada | `auth.uid == userId` e tenant valido | opcional, apenas se houver bootstrap direto |
| `sharing_policies` | negar leitura e escrita direta do cliente | `false` | area administrativa |
| `consolidation_runs` | negar leitura e escrita direta do cliente | `false` | acesso via API |
| anexos de licencas em Storage | negar acesso publico | auth obrigatorio e validacao de grant | preferir upload mediado por API |

## 22. Integracoes

| Integracao | Finalidade | Entrada | Saida | Falhas possiveis | Tratamento |
| --- | --- | --- | --- | --- | --- |
| Firebase Auth | autenticar o usuario | bearer token | identidade validada | token invalido ou expirado | `UNAUTHORIZED` |
| Catalogo mestre | validar CNAE, natureza juridica, regime e calendario | codigos do payload | validacao semantica | indisponibilidade, codigo inexistente | cache local e `INTEGRATION_ERROR` controlado |
| Auditoria central | persistir eventos | evento padronizado | confirmacao de gravação | falha de persistencia | operacao critica nao conclui silenciosamente |
| Runner assincrono | processar consolidacao | `runId` | atualizacao de status e itens | timeout, indisponibilidade, erro no job | retry e `failed` controlado |
| Modulos fiscal, financeiro e estoque | futura propagacao de escopo | companyId e establishmentId | documentos coerentes | contrato divergente | versionar contratos e bloquear inconsistencias |
| Notificacao | avisar consolidacao concluida ou bloqueada | status da run | evento ao usuario | indisponibilidade | nao bloquear a finalizacao da run |

## 23. Estrutura de arquivos backend

```text
/backend/api_node/src/modules/governance/
  companies/
    companies.routes.ts
    companies.controller.ts
    companies.service.ts
    companies.repository.ts
    companies.schemas.ts
    companies.permissions.ts
    companies.errors.ts
    companies.audit.ts
    __tests__/
      companies.service.test.ts
      companies.routes.test.ts
      companies.authz.test.ts
  establishments/
    establishments.routes.ts
    establishments.controller.ts
    establishments.service.ts
    establishments.repository.ts
    establishments.schemas.ts
    establishments.permissions.ts
    establishments.errors.ts
    establishments.audit.ts
    __tests__/
      establishments.service.test.ts
      establishments.routes.test.ts
  grants/
    grants.routes.ts
    grants.controller.ts
    grants.service.ts
    grants.repository.ts
    grants.schemas.ts
    grants.permissions.ts
    grants.audit.ts
    __tests__/
      grants.service.test.ts
      grants.authz.test.ts
  contexts/
    contexts.routes.ts
    contexts.controller.ts
    contexts.service.ts
    contexts.repository.ts
    contexts.schemas.ts
    contexts.audit.ts
    __tests__/
      contexts.service.test.ts
  sharing-policies/
    sharing-policies.routes.ts
    sharing-policies.controller.ts
    sharing-policies.service.ts
    sharing-policies.repository.ts
    sharing-policies.schemas.ts
    sharing-policies.permissions.ts
    sharing-policies.audit.ts
  consolidation-runs/
    consolidation-runs.routes.ts
    consolidation-runs.controller.ts
    consolidation-runs.service.ts
    consolidation-runs.repository.ts
    consolidation-runs.schemas.ts
    consolidation-runs.permissions.ts
    consolidation-runs.audit.ts
    consolidation-runs.state-machine.ts
    __tests__/
      consolidation-runs.service.test.ts
      consolidation-runs.routes.test.ts
  common/
    governance-authz.ts
    governance-mappers.ts
    governance-state-machines.ts
    governance-idempotency.ts
    governance-firestore-paths.ts
    governance-query-limits.ts
```

| Arquivo | Responsabilidade | Principais funcoes/classes |
| --- | --- | --- |
| `*.routes.ts` | registrar rotas no Fastify | handlers e schemas |
| `*.controller.ts` | adaptacao HTTP | parse, call service, response envelope |
| `*.service.ts` | regra de negocio | validacao de fluxo, grants, status e side effects |
| `*.repository.ts` | persistencia Firestore | list, find, save, update, duplicate checks |
| `*.schemas.ts` | reexport e composicao dos schemas | requests e queries |
| `*.permissions.ts` | constantes e guards | permissoes do recurso |
| `*.errors.ts` | erros especificos | mapeamento de codigos |
| `*.audit.ts` | builders de evento de auditoria | payloads before/after |
| `governance-authz.ts` | ABAC do dominio | tenant, company e establishment guards |
| `governance-idempotency.ts` | replay seguro | fingerprint e reexecucao |
| `governance-state-machines.ts` | transicoes | validadores de estado |
| `governance-firestore-paths.ts` | padrao de paths | builders centralizados |

## 24. Fluxos tecnicos backend

### Fluxo de criacao de empresa

1. Receber `POST /v1/governance/companies`
2. Validar token Firebase
3. Validar permissao `governance.company.create`
4. Validar `CreateCompanyRequestSchema`
5. Normalizar identificadores e nomes
6. Validar catalogos mestres
7. Verificar duplicidade por `companyRootRegistration`
8. Aplicar idempotencia
9. Persistir `Company`
10. Registrar auditoria
11. Retornar envelope de sucesso

### Fluxo de criacao de estabelecimento

1. Receber `POST /v1/governance/establishments`
2. Validar autenticacao e permissao
3. Validar schema
4. Carregar `Company`
5. Validar `companyId` no tenant
6. Validar tipo explicito e regra da matriz principal
7. Validar CNAE e registro
8. Verificar duplicidade por `registrationNumber`
9. Aplicar idempotencia
10. Persistir `Establishment`
11. Atualizar `primaryEstablishmentId` quando aplicavel
12. Registrar auditoria
13. Retornar sucesso

### Fluxo de atualizacao de grants

1. Receber `PUT /v1/governance/users/:userId/scope-grants`
2. Validar autenticacao e permissao elevada
3. Validar schema
4. Carregar grants atuais
5. Validar coerencia empresa -> estabelecimento
6. Validar defaults
7. Persistir grants
8. Invalidar contexto de escrita se ele se tornar ilegal
9. Registrar auditoria completa
10. Retornar estado final

### Fluxo de troca de contexto

1. Receber `POST /v1/governance/me/context/switch`
2. Validar autenticacao
3. Validar permissao `governance.context.switch`
4. Validar schema
5. Carregar grants do usuario
6. Validar que o escopo pedido e subconjunto do grant
7. Persistir `UserContext`
8. Registrar auditoria da troca
9. Retornar contexto atualizado

### Fluxo de consulta consolidada

1. Receber `GET /v1/governance/consolidated/*`
2. Validar autenticacao
3. Validar permissao `reporting.consolidated.read`
4. Validar filtros e pagina
5. Intersectar query com grants do usuario
6. Executar consulta paginada em read model ou agregacao controlada
7. Registrar log estruturado
8. Retornar envelope com meta de pagina

### Fluxo de criacao de run de consolidacao

1. Receber `POST /v1/governance/consolidation-runs`
2. Validar autenticacao e permissao
3. Validar schema
4. Validar empresas participantes, status e grants
5. Rodar pre-checagens de calendario, moeda, mapeamento e percentual
6. Aplicar idempotencia
7. Persistir run em `queued` ou `blocked`
8. Registrar auditoria
9. Enfileirar processamento quando aplicavel
10. Retornar detalhe da run

### Fluxo de erro

1. Capturar erro de schema, auth, authz, regra de negocio, integracao ou infraestrutura
2. Mapear para codigo padronizado
3. Registrar log com `correlationId`
4. Nao expor stack trace ao cliente
5. Retornar envelope de erro consistente

## 25. Testes backend

| Teste | Tipo | Objetivo | Entrada | Resultado esperado | Regra relacionada |
| --- | --- | --- | --- | --- | --- |
| Criar empresa valida | integracao | persistir empresa correta | payload valido | `201` e auditoria | cadastro de empresa |
| Bloquear empresa duplicada | integracao | validar unicidade | mesmo `companyRootRegistration` | `409` | duplicidade |
| Criar matriz principal valida | integracao | aceitar matriz unica | payload valido | `201` | matriz principal |
| Bloquear segunda matriz principal | integracao | proteger estrutura | outra matriz principal | `409` | matriz unica ativa |
| Bloquear tipo ausente | schema | exigir `establishmentType` | payload sem tipo | `400/422` | tipo explicito |
| Bloquear grant inconsistente | unitario + integracao | garantir coerencia hierarquica | filial fora da empresa | `409` | grants |
| Trocar contexto valido | integracao | atualizar `UserContext` | escopo autorizado | `200` | contexto |
| Bloquear contexto fora do grant | integracao | negar troca | escopo invalido | `403` | autorizacao |
| Leitura consolidada restrita | integracao | garantir subset do grant | filtros amplos | dados restritos ou `403` | leitura multiempresa |
| Arquivar empresa com dependencia | unitario | impedir perda de estrutura | empresa com dependencia | `409` | archive blocked |
| Conflito de versao | integracao | proteger concorrencia | `version` defasada | `409` | controle otimista |
| Idempotencia de criacao | integracao | nao duplicar registros | mesma chave e payload | mesma resposta | idempotencia |
| Conflito de idempotencia | integracao | detectar replay divergente | mesma chave com payload diferente | `409` | idempotencia |
| Criar run bloqueada por mapeamento | integracao | validar pre-checagem | run incompleta | `422` ou `blocked` | consolidacao |
| Reprocessar run invalida | unitario | respeitar maquina de estados | status nao elegivel | `422` | transicoes |
| Auditoria obrigatoria | integracao | registrar evento critico | mutacao critica | evento persistido | auditoria |
| Acesso cross-tenant | integracao | negar vazamento | token tenant A e dado tenant B | `403` | isolamento |
| Firebase Rules negam escrita direta | emulator | proteger colecoes centrais | client SDK | `deny` | rules |

## 26. Criterios tecnicos de aceite

| ID | Cenario tecnico | Dado que | Quando | Entao |
| --- | --- | --- | --- | --- |
| `BE-AC-001` | Criar empresa valida | usuario com permissao | envia payload valido | API cria empresa e registra auditoria |
| `BE-AC-002` | Request invalido | payload incompleto | envia criacao de empresa | API retorna `VALIDATION_ERROR` |
| `BE-AC-003` | Sem autenticacao | token ausente | chama rota protegida | API retorna `UNAUTHORIZED` |
| `BE-AC-004` | Sem permissao | usuario sem permissao | tenta criar empresa | API retorna `FORBIDDEN` |
| `BE-AC-005` | Acesso indevido a tenant | token de outro tenant | tenta acessar registro | API retorna `TENANT_ACCESS_DENIED` |
| `BE-AC-006` | Acesso indevido a empresa | usuario sem grant | le ou edita empresa fora do escopo | API retorna `COMPANY_ACCESS_DENIED` |
| `BE-AC-007` | Acesso indevido a filial | usuario sem grant | le ou edita filial fora do escopo | API retorna `BRANCH_ACCESS_DENIED` |
| `BE-AC-008` | Segunda matriz principal | empresa ja possui matriz principal | cria nova matriz principal | API retorna `COMPANY_ALREADY_HAS_PRIMARY_MATRIX` |
| `BE-AC-009` | Grant inconsistente | grant mistura empresa e filial de outra empresa | salva grants | API retorna `GRANT_SCOPE_INCONSISTENT` |
| `BE-AC-010` | Contexto invalido | usuario sem grant no escopo | troca contexto | API retorna `CONTEXT_SCOPE_INVALID` |
| `BE-AC-011` | Duplicidade | mesmo identificador cadastral | recria registro | API retorna `DUPLICATE_RECORD` |
| `BE-AC-012` | Conflito de versao | registro mudou | salva com `version` antiga | API retorna `VERSION_CONFLICT` |
| `BE-AC-013` | Operacao idempotente repetida | mesma chave e payload | repete a chamada | API devolve a mesma resposta sem duplicar side effects |
| `BE-AC-014` | Auditoria registrada | mutacao critica concluiu | operacao termina | existe evento auditavel correspondente |
| `BE-AC-015` | Log estruturado gerado | request processada | operacao finaliza | log contem `correlationId` e escopo |
| `BE-AC-016` | Consolidacao bloqueada | faltam mapeamentos | cria run | API bloqueia execucao indevida |

## 27. Plano de implementacao

| Ordem | Atividade | Arquivos impactados | Dependencias | Criterio de pronto |
| --- | --- | --- | --- | --- |
| 1 | Definir enums, tipos e erros do dominio | `shared_contracts/v1/governance/*` | nenhuma | contratos versionados |
| 2 | Definir schemas Zod de requests e queries | `shared_contracts/v1/governance/*.schemas.ts` | ordem 1 | validacoes documentadas |
| 3 | Definir modelo Firestore e builders de path | `governance-firestore-paths.ts` | ordem 1 | paths estaveis |
| 4 | Implementar repositories de empresa e estabelecimento | `companies/*`, `establishments/*` | ordens 1 a 3 | persistencia e duplicidade prontas |
| 5 | Implementar services e maquinas de estado | `*.service.ts`, `governance-state-machines.ts` | ordem 4 | regras centrais implementaveis |
| 6 | Implementar grants e contextos | `grants/*`, `contexts/*` | ordens 1 a 5 | authz por escopo funcional |
| 7 | Implementar controllers e rotas | `*.routes.ts`, `*.controller.ts` | ordens 4 a 6 | endpoints expostos |
| 8 | Implementar auditoria e idempotencia | `*.audit.ts`, `governance-idempotency.ts` | ordens 4 a 7 | mutacoes protegidas |
| 9 | Implementar politicas de compartilhamento | `sharing-policies/*` | ordens 1 a 8 | `scopeType` e `shareMode` persistidos |
| 10 | Implementar leitura consolidada base | `consolidated/*` ou read models | ordens 6 a 9 | consultas paginadas seguras |
| 11 | Implementar `ConsolidationRun` | `consolidation-runs/*` | ordens 6 a 10 | run formal criada e consultavel |
| 12 | Ajustar Firebase Rules e testes de emulador | `firebase/rules/*` | ordens 3 a 11 | acesso direto protegido |
| 13 | Fechar testes unitarios, integracao e authz | `__tests__/*` | ordens 4 a 12 | fluxos criticos cobertos |
| 14 | Documentar operacao e validacao | docs backend e architecture | todas | handoff completo |

### Fases recomendadas

1. Contratos compartilhados
2. Schemas e tipos
3. Modelo Firestore
4. Repository
5. Service
6. Controller e routes
7. Autorizacao
8. Auditoria
9. Idempotencia
10. Firebase Rules
11. Testes
12. Documentacao

## 28. Comandos de validacao

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run validate
```

Com emuladores Firebase:

```bash
firebase emulators:start --only auth,firestore,storage
firebase emulators:exec --only auth,firestore,storage "npm run test -w @eixoone/api-node"
```

## 29. Riscos tecnicos

- modelar `unidade operacional` cedo demais sem parent fechado
- permitir leitura consolidada com fan-out caro no Firestore
- tratar consolidacao como query online e nao como processo formal
- denormalizar grants de modo inconsistente
- abrir escrita direta em colecoes centrais para o cliente
- depender de catalogos inexistentes em tempo de gravacao
- antecipar intercompany sem contratos fechados
- nao distinguir acoes de nivel tenant de acoes de contexto de escrita

## 30. Checklist Backend

### Contratos
- [ ] Tipos definidos
- [ ] Schemas Zod definidos
- [ ] Requests e responses definidos
- [ ] Codigos de erro definidos
- [ ] Permissoes definidas

### API
- [ ] Endpoints definidos
- [ ] Envelopes padronizados
- [ ] Validacoes documentadas
- [ ] Erros mapeados

### Seguranca
- [ ] Autenticacao definida
- [ ] Autorizacao definida
- [ ] Multi-tenancy definido
- [ ] Empresa/filial definidos
- [ ] Protecao contra acesso horizontal definida

### Persistencia
- [ ] Collections definidas
- [ ] Documentos definidos
- [ ] Indices definidos
- [ ] Soft delete definido
- [ ] Auditoria definida

### Qualidade
- [ ] Testes unitarios definidos
- [ ] Testes de integracao definidos
- [ ] Testes de autorizacao definidos
- [ ] Testes multi-tenant definidos
- [ ] Testes de idempotencia definidos
- [ ] Criterios tecnicos de aceite definidos

## 31. Pendencias para validacao humana

1. Confirmar o parent definitivo de `unidade operacional`.
2. Confirmar se `GrupoEconomico` entra como entidade visivel no V1.
3. Fechar o catalogo e a semantica final de `consolidationMode`.
4. Fechar com controladoria os parametros obrigatorios de `fxPolicy`, `percentagePolicy`, calendario e eliminacoes.
5. Confirmar o escopo real de `MEI` no primeiro release.
6. Confirmar a origem oficial dos catalogos mestres de CNAE, natureza juridica, regime tributario e calendario fiscal.
7. Definir se alguma projecao de contexto sera lida diretamente por Firebase ou se tudo passara exclusivamente pela API.
8. Definir politica final de anexos de licencas: tipos, tamanho, retencao e fluxo de upload.
9. Confirmar quando intercompany sai de "preparado em contrato" para "implementado no runtime".
10. Definir teto de `pageSize`, retencao de auditoria e politica operacional de reprocessamento.
