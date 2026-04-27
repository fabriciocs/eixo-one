# Documento 01 — Definição, Pesquisa e Produto — FG-008

## 1. Solicitação original

Atuar na **FG-008 — Integrações, API e webhooks**, respeitando as regras e definições da planilha `eixoone_planilha_uxui_funcionalidades_completa.xlsx` e dos catálogos funcionais enviados.

## 2. Objetivo e resultado esperado

Implementar uma entrega fullstack exemplar para o EixoOne que permita expor e consumir dados de sistemas externos, incluindo clientes de API, assinaturas de webhooks, versionamento de endpoints, autenticação por token, auditoria, idempotência, rate limit previsto e isolamento multiempresa/multifilial.

Resultado esperado:

- Contratos compartilhados para API e frontend.
- Backend modular com validações server-side, autorização, idempotência e auditoria.
- Frontend Flutter mobile-first com lista, filtros, estados, confirmação crítica e acessibilidade.
- Regras Firebase deny by default.
- OpenAPI inicial.
- Testes automatizados executáveis localmente.
- ZIP com o código-fonte criado.

## 3. Repositório da aplicação

| Item | Valor | Status | Observação |
|---|---|---|---|
| URL/caminho | Não fornecido | Pendente | Foi criada estrutura exemplar em `/mnt/data/entregas/fg-008-integracoes-api-webhooks/codigo-fonte`. |
| Branch base | Não fornecida | Pendente | Sem repositório real; foi inicializado Git local apenas para a entrega. |
| Branch da entrega | `feature/fg-008-integracoes-api-webhooks` | Criado localmente | Branch criada no repositório exemplar. |
| Commit | `7e02b0b` | Criado localmente | Commit de código-fonte da entrega exemplar. |
| Remote/push | Ausente | Não executado | Não havia remote configurado. |

## 4. Stack e padrões assumidos

| Categoria | Valor identificado/assumido | Fonte | Status |
|---|---|---|---|
| Backend | Node.js + TypeScript + API estilo Fastify | Planilhas funcionais e superadmin enviadas | Assumido |
| Frontend | Flutter mobile-first + Material 3, compatível com Riverpod/GoRouter | Planilha UX/UI e catálogo superadmin | Assumido |
| Autenticação | Firebase Auth, ID Token e custom claims | Planilhas enviadas | Assumido |
| Banco | Firestore com regras deny by default | Planilhas enviadas | Assumido |
| Contratos | `packages/sharedcontracts` versionado | Planilhas enviadas | Assumido |
| Testes | TypeScript build/typecheck + teste Node local; Flutter test previsto | Ambiente local sem Flutter executável | Parcial |

## 5. Escopo

### Dentro do escopo

- Clientes de API (`ApiClient`) com escopo por tenant, empresa e filial.
- Webhooks (`WebhookSubscription`) com URL HTTPS, eventos e política de retry.
- Listagem, detalhe, criação, suspensão, reativação, arquivamento, exportação e histórico.
- Envelope padrão `{
  ok,
  data,
  error,
  meta
}`.
- Header `x-idempotency-key` obrigatório em mutações críticas.
- Auditoria estruturada com actor, target, before/after redigido, reason, IP, userAgent, requestId e idempotencyKey.
- Mascaramento de credenciais, tokens, PII e chaves.
- Firestore Rules e Storage Rules com bloqueio de escrita direta.
- OpenAPI 3.1.0 inicial.
- UI Flutter com estados loading, empty, error, lista, sem permissão e confirmação crítica.

### Fora de escopo

- Integrações reais com bancos, gateways, marketplace, fiscal, BI ou automações.
- Provisionamento real de Secret Manager.
- Fila real de delivery/retry de webhooks.
- Deploy Cloud Run/Firebase.
- Migração no repositório real.
- Validação jurídica definitiva de base legal, retenção e RIPD/DPIA.

### MVP

- Backend e contratos para governar clientes de API e webhooks.
- Tela Flutter administrativa com lista/filtro e ação crítica.
- Auditoria e idempotência em mutações.
- Testes automatizados locais cobrindo validação, autorização, idempotência e auditoria.

### Evolução futura

- Delivery worker com fila, DLQ e reprocessamento.
- UI completa de criação/edição de cliente API e webhook.
- Assinatura de webhooks com rotação automatizada.
- Portal de desenvolvedor e documentação pública por tenant.
- Métricas operacionais de latência, erro e tentativas de entrega.
- Emulator tests Firebase e testes Flutter integrados no repositório real.

## 6. Usuários, perfis e permissões

| Perfil | Objetivo | Permissões | Restrições |
|---|---|---|---|
| `integration_admin` | Configurar e operar integrações do tenant | `read`, `create`, `update`, `suspend`, `reactivate`, `archive`, `export`, `history` conforme grant | Escopo limitado a tenant/empresa/filial autorizados. |
| `auditor` | Consultar integrações e trilha de auditoria | `read`, `history`, eventualmente `export` | Sem mutações. Exportação exige reason. |
| `operations_user` | Acompanhar status e falhas | `read` | Sem acesso a segredos e sem ações críticas. |
| `platform_admin` | Suporte/governança global auditável | Bypass parcial por role | Exige MFA/reautenticação, reason, idempotência e auditoria. |
| `security_admin` | Suspender, revisar e auditar riscos | `read`, `suspend`, `history`, `export` | Sem acesso a segredos em claro. |

## 7. Regras de negócio

| ID | Regra | Origem | Prioridade | Status |
|---|---|---|---|---|
| RN-001 | Toda operação protegida exige usuário autenticado. | FG-008/segurança | Alta | Implementado |
| RN-002 | Validar tenant, empresa e filial server-side. | FG-008 multiempresa/multifilial | Alta | Implementado |
| RN-003 | Flutter nunca usa service account. | Definições EixoOne | Alta | Implementado por arquitetura |
| RN-004 | Mutações críticas exigem `x-idempotency-key`. | FG-008 | Alta | Implementado |
| RN-005 | Suspender, reativar, arquivar e exportar exigem reason. | Auditoria/LGPD | Alta | Implementado |
| RN-006 | Segredos e credenciais não retornam em claro. | Segurança | Alta | Implementado |
| RN-007 | Exportação deve ser mascarada e auditada. | Segurança/LGPD | Alta | Implementado |
| RN-008 | Firestore/Storage devem negar escrita direta do cliente. | EixoOne | Alta | Implementado |
| RN-009 | Toda resposta segue envelope padrão. | Padrão EixoOne | Alta | Implementado |
| RN-010 | OpenAPI deve documentar endpoints e erros. | FG-008 | Média | Implementado inicial |

## 8. Campos, validações e mensagens

| Campo | Tipo | Obrigatório | Validação | Mensagem | Sensível | Auditável |
|---|---|---:|---|---|---:|---:|
| `tenantId` | string | Sim | Contexto autenticado ou query/body autorizado | Contexto de tenant é obrigatório. | Sim | Sim |
| `empresaId` | string | Condicional | Deve pertencer ao actor | Empresa fora do escopo autorizado. | Sim | Sim |
| `filialId` | string | Condicional | Deve pertencer ao actor | Filial fora do escopo autorizado. | Sim | Sim |
| `code` | string | Sim | 2–30, letras, números, `.`, `_`, `-` | Código inválido. | Não | Sim |
| `name` | string | Sim | 2–150, sem HTML | Nome inválido. | Não | Sim |
| `targetUrl` | URL | Sim para webhook | HTTPS, até 2048 caracteres | Informe uma URL HTTPS válida. | Pode ser | Sim |
| `allowedOrigins` | string[] | Sim para API client | Todas HTTPS | Origem permitida deve ser HTTPS. | Pode ser | Sim |
| `credentialKind` | enum | Sim | `oauth2`, `api_key`, `webhook_secret`, `oidc`, `saml` | Credencial inválida. | Sim | Sim |
| `secretRef` | string backend-only | Sim | Gerado no backend/cofre | Segredos não podem vir do cliente. | Sim | Sim mascarado |
| `reason` | string | Sim em mutações/export | 10–500, sem HTML | Justificativa obrigatória. | Pode conter PII | Sim redigido |
| `confirmationText` | string | Sim em ação crítica | Deve igualar `targetId` | Confirmação não corresponde ao alvo. | Não | Sim |
| `x-idempotency-key` | header | Sim em POST/PATCH críticos | 16–128 caracteres | Header obrigatório. | Não | Sim |

## 9. Estados, transições e fluxos

Estados de integração: `pending_review`, `active`, `suspended`, `archived`.

Transições MVP:

- `pending_review → active`: aprovação/criação válida.
- `active → suspended`: suspensão preventiva com reason, confirmação, MFA quando aplicável e auditoria.
- `suspended → active`: reativação com reason e auditoria.
- `active|suspended → archived`: arquivamento com reason e confirmação.
- `archived → active`: fora do MVP; exige política de restauração validada.

Fluxo principal:

1. Usuário autenticado acessa Integrações, API e webhooks.
2. Sistema carrega contexto tenant/empresa/filial e permissões.
3. Usuário filtra/lista API clients e webhooks.
4. Usuário executa criação ou ação crítica.
5. Backend valida token, claims, escopo, payload e idempotência.
6. Backend persiste registro e audit log.
7. Frontend mostra feedback acessível e atualiza lista.

## 10. Requisitos funcionais e não funcionais

| Tipo | Requisito | Status |
|---|---|---|
| Funcional | Disponibilizar API REST documentada | Implementado em OpenAPI inicial |
| Funcional | Autenticar tokens | Implementado via contrato de `AuthContext`; integração Firebase real pendente |
| Funcional | Criar webhooks | Implementado |
| Funcional | Mapear campos/escopos | Implementado em DTOs/contratos |
| Funcional | Monitorar integrações | Implementado como audit/history inicial; métricas futuras |
| Funcional | Retentar falhas | Modelo `retryPolicy` implementado; worker pendente |
| Funcional | Registrar payloads | Previsto via `IntegrationEventLog`; armazenamento real pendente |
| Funcional | Versionar endpoints | Implementado em `endpointVersions` |
| Não funcional | OAuth/API key | Modelado por referência a credencial/cofre |
| Não funcional | Rate limit | Previsto em documentação e arquitetura; middleware real pendente |
| Não funcional | Idempotência | Implementado |
| Não funcional | Filas | Fora do MVP, previsto |
| Não funcional | Logs/auditoria | Implementado |
| Não funcional | Baixa indisponibilidade | Arquitetura compatível com Cloud Run; deploy pendente |
| Não funcional | LGPD | Minimização, mascaramento e retenção proposta; validação DPO pendente |

## 11. Pesquisa e benchmark

| Fonte | Tipo | Achado | Decisão derivada | Validação humana |
|---|---|---|---|---|
| OpenAPI Specification 3.1.0 — https://spec.openapis.org/oas/v3.1.0.html | Oficial | Padroniza descrição de APIs HTTP legível por humanos e máquinas | Criado `openapi/fg-008-integrations.openapi.yaml` | Revisar padrão de versão adotado pelo projeto |
| OWASP API Security Top 10 2023 — https://owasp.org/API-Security/editions/2023/en/0x11-t10/ | Segurança | Riscos centrais incluem autorização por objeto, autenticação e consumo irrestrito | Escopo server-side, permissões, idempotência e limites | Segurança/AppSec |
| OWASP REST Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html | Segurança | Recomenda erro genérico, validação, logs de auditoria e cuidado com tokens | Envelope sem stack trace e logs redigidos | Segurança/AppSec |
| OWASP Logging Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html | Segurança | Logs de aplicação devem apoiar rastreabilidade sem expor dados sensíveis | Audit log estruturado com redaction | Segurança/AppSec |
| Firebase Auth custom claims — https://firebase.google.com/docs/auth/admin/custom-claims | Oficial | Claims customizadas suportam estratégias de controle de acesso | `roleKeys`, `permissionKeys`, `moduleKeys` | Validar limites e refresh de token |
| Firebase Verify ID Tokens — https://firebase.google.com/docs/auth/admin/verify-id-tokens | Oficial | Backend valida ID token via Admin SDK | Flutter envia Bearer token; API valida | Implementar adapter real |
| Material Design 3 Accessibility — https://m3.material.io/foundations/designing/structure | UX/UI | Alvos de toque e estrutura acessível são essenciais em mobile | UI com labels, Semantics e estados | QA acessibilidade |
| ANPD/LGPD Guias — https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes/5-adequacao-a-lgpd/5-6-estao-disponiveis-guias | LGPD | Guias orientativos auxiliam adequação à LGPD | DPO deve validar base legal, retenção e RIPD | DPO/Jurídico |

## 12. Política de autenticação e segurança

### Senha

Delegada ao Firebase Auth ou IdP corporativo. Política final de senha deve ser definida pelo provedor e validada por Segurança.

### MFA

Ações críticas por `platform_admin` e exportações sensíveis exigem MFA ou reautenticação recente. No código exemplar, `mfaVerified` é verificado no `AuthContext`.

### Sessão

Flutter deve enviar Firebase ID Token via `Authorization: Bearer <idToken>`. Backend valida token com Admin SDK no repositório real. Tokens não devem ser gravados em logs.

### Lockout/rate limit

Pendente de middleware real. Recomendação: rate limit por actor, tenant, IP, endpoint e ação crítica; respostas 429 com envelope padrão.

### Recuperação de conta

Fora da FG-008; manter política global do EixoOne/Firebase Auth.

### Retenção e auditoria

- Audit logs: retenção sugerida mínima de 5 anos ou conforme política corporativa/legal.
- Payloads de integração: reter apenas referência e metadados mínimos; conteúdo sensível deve ser armazenado com TTL curto e criptografia.
- Idempotency keys: TTL sugerido de 24 horas.
- Exportações: registrar reason, actor, filtro, row count, requestId e destino; não registrar conteúdo exportado em log.

## 13. LGPD

| Tema | Definição | Pendência DPO/Jurídico |
|---|---|---|
| Dados pessoais | Podem existir em payloads, URLs, logs de eventos e reason. | Classificar categorias por integração/provedor. |
| Base legal | Em geral execução de contrato, legítimo interesse ou obrigação legal conforme integração. | Validar por caso de uso e contrato com cliente. |
| Retenção | Idempotência 24h; payload sensível com TTL curto; auditoria conforme política legal. | Aprovar tabela de retenção. |
| Exclusão/anonimização | Dados operacionais podem exigir retenção; aplicar anonimização em payloads quando possível. | Definir exceções legais/fiscais. |
| Direitos do titular | Exportar, retificar ou eliminar dados depende do módulo origem. | Integrar com fluxo global de direitos do titular. |
| RIPD/DPIA | Recomendado se houver dados sensíveis, fiscais, financeiros ou grande volume. | Avaliação DPO obrigatória antes de produção. |

## 14. Provedores externos

| Provedor | Finalidade | Confirmado? | Pendência |
|---|---|---|---|
| Secret Manager/cofre | Guardar API keys, OAuth secrets e webhook secrets | Não | Confirmar provedor padrão do EixoOne. |
| Gateway/bancos/fiscal/BI | Integrações externas | Não | Confirmar provedores, SLAs, autenticação e contratos. |
| Fila/DLQ | Entrega e retry de webhooks | Não | Confirmar Pub/Sub, Cloud Tasks ou equivalente. |
| SSO/OIDC/SAML | Credenciais de integração | Não | Validar provedores corporativos. |

## 15. Critérios de aceite

- Usuário sem permissão recebe 403 sem vazamento de metadados sensíveis.
- Tenant/empresa/filial fora do escopo é bloqueado no backend.
- Dados inválidos não geram gravação parcial.
- POST/PATCH crítico sem `x-idempotency-key` é rejeitado.
- Replay idempotente com mesmo payload retorna resposta cacheada.
- Replay com payload diferente gera conflito.
- Toda mutação crítica grava audit log com redaction.
- Firestore/Storage não permitem escrita direta pelo cliente.
- UI exibe loading, vazio, erro, lista e confirmação crítica.
- ZIP contém apenas arquivos relacionados à entrega.

## 16. Premissas, riscos e pendências críticas

| Tipo | Descrição | Impacto | Próximo passo |
|---|---|---|---|
| Premissa | Repositório real não foi fornecido. | Implementação é exemplar. | Aplicar arquivos no monorepo real e ajustar imports/adapters. |
| Premissa | Stack assumida por planilhas. | Pode divergir do código real. | Confirmar README e padrões existentes. |
| Risco | Provedores externos não confirmados. | Campos/autenticação podem mudar. | Validar integrações reais. |
| Risco | LGPD depende de finalidade e payload real. | Risco regulatório. | DPO/Jurídico aprovar base legal, retenção e RIPD. |
| Pendência | Flutter/Dart não executável no ambiente. | Testes Flutter não rodaram. | Executar `flutter test` no ambiente do projeto. |
| Pendência | Sem remote Git. | Push não feito. | Configurar remote e executar push manual. |
