# EixoOne Foundation

## Visao geral

O EixoOne segue uma arquitetura modular com fronteiras explicitas entre:

- `Flutter`: interface mobile-first, responsiva e desacoplada da regra de negocio.
- `Firebase`: autenticacao, Firestore, Storage, Hosting, emuladores e protecoes por rules.
- `Node.js/TypeScript`: API HTTP, integracoes, validacoes sensiveis, auditoria, idempotencia e orquestracao.
- `shared_contracts`: linguagem comum entre backend, funcoes e clientes, com schemas e versionamento explicito.

## Regras de uso por canal

### Flutter direto no Firebase

Use para:

- leitura de dados operacionais de baixa sensibilidade;
- sincronizacao em tempo real;
- uploads autorizados por rules;
- preferencia do usuario e notificacoes simples.

### Flutter chamando API Node.js

Use para:

- operacoes multi-etapas;
- validacao de permissao fina;
- regras financeiras/fiscais;
- escrita auditavel;
- integracoes externas;
- acoes criticas que exigem idempotencia.

### Cloud Functions

Use para:

- gatilhos curtos de Auth/Firestore/Storage;
- webhooks pequenos;
- tarefas assicronas proximas do Firebase.

### Cloud Run

Use para:

- API principal do EixoOne;
- integracoes complexas;
- processos com dependencia nativa;
- observabilidade e rollout independentes.

## Camadas do backend

Cada modulo deve separar:

- `domain`: entidades, invariantes, maquinas de estado.
- `application`: casos de uso, contratos de repositorio e servicos.
- `infrastructure`: adaptadores Firebase/Admin/externos.
- `interfaces`: HTTP, DTOs, validadores e controllers.
- `core`: erros padronizados, resiliencia, logging e auditoria.

## Padroes obrigatorios

- Envelopes padronizados de sucesso/erro.
- `correlationId` e `requestId` em toda resposta.
- Validacao forte com schema antes de entrar na regra de negocio.
- Idempotencia em operacoes criticas.
- Auditoria para alteracoes sensiveis.
- Multi-tenant por `tenantId`.
- Paginacao obrigatoria em listagens.

## Estado atual implementado

- `users` e fluxo de mudanca de status como modulo de referencia.
- `governance` com empresas, estabelecimentos, grants, contexto operacional, sharing policies e consolidation runs.
- `health` e `ready`.
- `shared_contracts` versionado em `v1`.
- Persistencia real em Firestore para `users`, `governance`, auditoria e idempotencia quando `DATA_MODE=firebase`.
- `Flutter` com sessao local e design system reutilizavel.
