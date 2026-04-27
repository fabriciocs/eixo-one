# Documento 03 — QA, Evidências e Relatório Final — FG-008

## 1. Estratégia de QA

A estratégia cobre:

- Validação estática TypeScript.
- Build TypeScript.
- Testes automatizados Node sem dependências externas.
- Scan de manifest e padrões de segredo.
- Revisão de arquivos gerados.
- Registro de limitações do ambiente para Dart/Flutter.
- Matriz de rastreabilidade entre requisitos, implementação e testes.

## 2. Matriz de rastreabilidade

| Requisito | Regra | Critério de aceite | Teste | Tipo | Automatizado | Status |
|---|---|---|---|---|---|---|
| RF-001 Listar integrações | Validar auth, módulo, permissão e escopo | Lista retorna API clients e webhooks do tenant | `npm test` lista com 1 API client e 1 webhook | Unit/integration local | Sim | OK |
| RF-002 Criar API client | Payload válido e idempotency key | Registro criado e credencial redigida | `npm test` create API client | Unit local | Sim | OK |
| RF-003 Criar webhook | URL HTTPS e eventos permitidos | Webhook criado | `npm test` create webhook | Unit local | Sim | OK |
| RF-004 Suspender/reativar | Reason, confirmação, MFA quando aplicável | Status alterado e auditado | `npm test` status change | Unit local | Sim | OK |
| RF-005 Histórico | Permissão `history` | Retorna eventos auditados | `npm test` history >= 3 | Unit local | Sim | OK |
| RF-006 Idempotência | Replay igual cacheia; payload diferente conflita | Sem duplicidade | `npm test` replay/mismatch | Unit local | Sim | OK |
| RNF-001 Segurança | Sem segredo em resposta/log | Credencial mascarada | `npm test` redaction | Unit local | Sim | OK |
| RNF-002 Tenant isolation | Bloquear sem permissão/escopo | 403-style error | `npm test` missing permission | Unit local | Sim | OK |
| RNF-003 Build | TS compila | `tsc` sem erros | `npm run build` | Build | Sim | OK |
| RNF-004 Manifest | ZIP sem dist/node_modules/segredos | Scan OK | `npm run validate:manifest` | Static scan | Sim | OK |
| UX-001 Estados de tela | loading/empty/error/list | Código implementado | Revisão estática Flutter | Manual | Parcial | OK/Pendente runtime |
| UX-002 Acessibilidade | labels, semantics, feedback | Componentes com `Semantics` e labels | Revisão estática | Manual | Parcial | OK/Pendente audit |

## 3. Plano de testes

| ID | Cenário | Tipo | Prioridade | Passos | Resultado esperado | Status |
|---|---|---|---|---|---|---|
| T-001 | Validar payload de API client | Unit | Alta | Enviar payload válido | `ok=true` | OK |
| T-002 | Bloquear origem HTTP | Unit | Alta | Enviar `allowedOrigins` HTTP | `ok=false` | OK |
| T-003 | Criar API client | Integration local | Alta | Chamar service com idempotency key | Envelope OK e credencial redigida | OK |
| T-004 | Replay idempotente | Integration local | Alta | Repetir mesmo payload/key | Mesmo ID retornado | OK |
| T-005 | Replay divergente | Integration local | Alta | Repetir key com payload diferente | Erro `IDEMPOTENCY_REPLAY_MISMATCH` | OK |
| T-006 | Criar webhook | Integration local | Alta | Chamar service | Envelope OK | OK |
| T-007 | Listar registros | Integration local | Alta | Chamar list | 1 API client e 1 webhook | OK |
| T-008 | Bloquear sem permissão | Security | Alta | Remover permissionKeys | Erro `PERMISSION_DENIED` | OK |
| T-009 | Suspender com auditoria | Integration local | Alta | PATCH status com reason/confirmação | Status `suspended` | OK |
| T-010 | Consultar histórico | Integration local | Alta | Chamar history | Eventos auditados | OK |
| T-011 | Flutter page states | UI | Média | Rodar `flutter test` | Estados renderizados | Pendente ambiente |
| T-012 | Firebase rules emulator | Security | Alta | Rodar emulator tests | Escrita direta negada | Pendente repo/ambiente |

## 4. Testes de autenticação e segurança

| Área | Cenário | Resultado esperado | Automatizar? | Status |
|---|---|---|---|---|
| Token | Requisição sem auth | 401 | Sim no repo real | Previsto |
| Claims | Sem módulo/permissão | 403 | Sim | OK em policy/service |
| Escopo | Tenant diferente | 403 | Sim | Implementado; ampliar teste real |
| MFA | Platform admin em ação crítica sem MFA | 403 | Sim | Implementado; ampliar teste |
| Idempotência | Replay divergente | 409 | Sim | OK |
| Rate limit | Abuso de POST/PATCH | 429 | Sim no middleware real | Pendente |
| Segredos | Resposta com credential | Mascarada | Sim | OK |
| LGPD/retenção | Payload sensível em log | Não registrar em claro | Sim/Manual | Parcial |

## 5. Mocks, fixtures e massas de dados

Fixtures no teste `tests/fg008.validation.test.cjs`:

- `actor` com tenant, empresa, filial, permissões e MFA.
- `apiClientPayload` com OAuth, endpoint version e origins HTTPS.
- `webhookPayload` com targetUrl HTTPS e eventos.
- `InMemoryIntegrationRepository` como repository fake.

## 6. Comandos executados

| Comando | Diretório | Resultado | Evidência |
|---|---|---|---|
| `npm run typecheck` | `codigo-fonte` | OK | `tsc -p tsconfig.json --noEmit` sem erros |
| `npm run build` | `codigo-fonte` | OK | `tsc -p tsconfig.json` sem erros |
| `npm test` | `codigo-fonte` | OK | `FG-008 validation tests passed` |
| `npm run validate:manifest` | `codigo-fonte` | OK | `Manifest and secret scan passed` |
| `dart --version` | `codigo-fonte` | Falhou | `/bin/sh: 1: dart: Permission denied` |
| `flutter --version` | `codigo-fonte` | Falhou | `/bin/sh: 1: flutter: Permission denied` |
| `git status --short` | `codigo-fonte` | Limpo | Sem alterações rastreadas |
| `git status --short --ignored` | `codigo-fonte` | `!! dist/` | Build gerou dist ignorado por `.gitignore` |

## 7. Erros encontrados e correções

| Erro | Causa | Correção | Status |
|---|---|---|---|
| `ERR_UNSUPPORTED_DIR_IMPORT` no teste Node | Build ES Modules com import de diretório | Ajustado para CommonJS no pacote exemplar | Corrigido |
| Assert de redaction esperava `credential.secretRef` | Redaction mascara bloco `credential` inteiro | Teste ajustado para validar `credential === "***REDACTED***"` | Corrigido |
| Manifest scan detectou seu próprio regex | Script continha padrões de busca | Script ignora o próprio arquivo de scanner | Corrigido |
| `dart/flutter Permission denied` | Ferramentas indisponíveis no ambiente | Documentado como pendência de validação no ambiente real | Pendente externo |

## 8. Evidências de validação

Saída consolidada:

```text
npm run typecheck
> tsc -p tsconfig.json --noEmit
Resultado: 0

npm run build
> tsc -p tsconfig.json
Resultado: 0

npm test
> node tests/fg008.validation.test.cjs
FG-008 validation tests passed
Resultado: 0

npm run validate:manifest
> node scripts/validate_manifest.mjs
Manifest and secret scan passed
Resultado: 0

dart --version
/bin/sh: 1: dart: Permission denied
Resultado: 127

flutter --version
/bin/sh: 1: flutter: Permission denied
Resultado: 127
```

## 9. Validação manual recomendada

- Confirmar repositório real, branch base e padrões de módulos.
- Substituir repository em memória por Firestore/Admin SDK real.
- Integrar middleware real de Firebase Auth e rate limit.
- Rodar `flutter test`, `flutter analyze` e build mobile.
- Rodar Firebase Emulator Suite para rules.
- Validar OpenAPI no pipeline existente.
- Validar UX com usuário gestor/integration admin.
- Revisar LGPD com DPO/Jurídico.
- Revisar MFA, retenção e SIEM com Segurança/AppSec.

## 10. Git

| Item | Valor |
|---|---|
| Repositório | Local exemplar em `codigo-fonte` |
| Branch | `feature/fg-008-integracoes-api-webhooks` |
| Commit | `7e02b0b` |
| Mensagem | `feat: implement fg-008 integracoes api webhooks` |
| Push | Não executado |
| Motivo do push | Remote ausente |
| Status | Limpo para arquivos rastreados; `dist/` ignorado após build |

Comandos executados:

```bash
git init
git checkout -b feature/fg-008-integracoes-api-webhooks
git status --short
git add .
git commit -m "feat: implement fg-008 integracoes api webhooks"
git branch --show-current
git rev-parse --short HEAD
git status --short
git remote -v
```

## 11. Manifest do ZIP de código-fonte

ZIP:

```text
fg-008-integracoes-api-webhooks_codigo-fonte.zip
```

SHA-256:

```text
2d2ef860eca56d91e7b21804646686531a34ca15d907c1ad8334020308f5d55d
```

Tamanho:

```text
32108 bytes
```

Arquivos incluídos:

- `.gitignore`
- `README.md`
- `apps/mobileflutter/lib/features/integrations_api_webhooks/application/integrations_controller.dart`
- `apps/mobileflutter/lib/features/integrations_api_webhooks/data/integrations_api.dart`
- `apps/mobileflutter/lib/features/integrations_api_webhooks/data/integrations_repository.dart`
- `apps/mobileflutter/lib/features/integrations_api_webhooks/models/integration_models.dart`
- `apps/mobileflutter/lib/features/integrations_api_webhooks/presentation/integrations_page.dart`
- `apps/mobileflutter/test/features/integrations_api_webhooks/integrations_page_test.dart`
- `backend/apinode/src/modules/base-governance/fg-008/audit.ts`
- `backend/apinode/src/modules/base-governance/fg-008/idempotency.ts`
- `backend/apinode/src/modules/base-governance/fg-008/policy.ts`
- `backend/apinode/src/modules/base-governance/fg-008/redaction.ts`
- `backend/apinode/src/modules/base-governance/fg-008/repository.ts`
- `backend/apinode/src/modules/base-governance/fg-008/routes.ts`
- `backend/apinode/src/modules/base-governance/fg-008/service.ts`
- `backend/apinode/src/modules/base-governance/fg-008/types.ts`
- `backend/apinode/src/modules/base-governance/index.ts`
- `firebase/firestore.indexes.json`
- `firebase/rules/firestore.rules`
- `firebase/rules/storage.rules`
- `openapi/fg-008-integrations.openapi.yaml`
- `package.json`
- `packages/sharedcontracts/src/index.ts`
- `packages/sharedcontracts/src/v1/base-governance/fg-008.ts`
- `packages/sharedcontracts/src/v1/base-governance/index.ts`
- `scripts/validate_manifest.mjs`
- `tests/fg008.validation.test.cjs`
- `tsconfig.json`

## 12. Arquivos principais implementados

| Arquivo | Finalidade |
|---|---|
| `packages/sharedcontracts/src/v1/base-governance/fg-008.ts` | Contratos, permissões, tipos, validadores e envelopes |
| `backend/apinode/src/modules/base-governance/fg-008/service.ts` | Casos de uso de listagem, criação, status, export e history |
| `backend/apinode/src/modules/base-governance/fg-008/policy.ts` | RBAC/ABAC, módulo, permissão, escopo e MFA |
| `backend/apinode/src/modules/base-governance/fg-008/idempotency.ts` | Controle de replay e conflito |
| `backend/apinode/src/modules/base-governance/fg-008/audit.ts` | Audit event estruturado |
| `backend/apinode/src/modules/base-governance/fg-008/redaction.ts` | Mascaramento de dados sensíveis |
| `backend/apinode/src/modules/base-governance/fg-008/routes.ts` | Rotas HTTP da FG-008 |
| `apps/mobileflutter/lib/features/integrations_api_webhooks/presentation/integrations_page.dart` | Tela Flutter mobile-first |
| `firebase/rules/firestore.rules` | Deny by default e leitura controlada |
| `openapi/fg-008-integrations.openapi.yaml` | Contrato OpenAPI inicial |
| `tests/fg008.validation.test.cjs` | Testes automatizados locais |

## 13. Pendências reais

| Pendência | Responsável sugerido | Impacto |
|---|---|---|
| Confirmar repositório real e branch base | Engenharia | Necessário para aplicar patch definitivo |
| Adaptar imports aos padrões reais | Engenharia | Pode exigir ajustes de paths |
| Trocar repository em memória por Firestore | Backend | Necessário para produção |
| Integrar Firebase Admin SDK real | Backend/Sec | Necessário para auth real |
| Implementar middleware de rate limit | Backend/Sec | Proteção contra abuso |
| Configurar Secret Manager/cofre | DevOps/Sec | Segredos reais |
| Rodar Flutter analyze/test/build | Mobile | Ambiente atual sem permissão |
| Rodar Firebase emulator tests | QA/DevOps | Validar rules |
| Validar LGPD/retenção/RIPD | DPO/Jurídico | Obrigatório antes de produção |
| Confirmar provedores externos | Produto/Arquitetura | Define payloads, SLAs e autenticação |

## 14. Riscos remanescentes

- Divergência entre estrutura exemplar e monorepo real.
- Ausência de validação runtime Flutter.
- Ausência de Firestore real e regras testadas em emulator.
- Retenção e base legal podem variar por integração.
- Rate limit e fila de retries ainda não implementados no runtime real.
- OpenAPI inicial pode precisar se alinhar ao gateway/API management corporativo.

## 15. Próximas ações

1. Aplicar o ZIP no monorepo EixoOne real.
2. Conectar adapters reais de Auth, Firestore, Secret Manager, logger e rate limit.
3. Rodar pipeline completo do projeto.
4. Executar validação DPO/Jurídico e Segurança.
5. Criar PR com branch `feature/fg-008-integracoes-api-webhooks` no remote real.
6. Fazer homologação com dados mascarados.

## 16. Resumo final da entrega

A FG-008 foi implementada como entrega exemplar completa, com contratos, backend, frontend Flutter, Firebase Rules, OpenAPI, testes, validações Node, Git local e ZIP de código-fonte. A entrega está pronta para aplicação/adaptação no repositório real do EixoOne.
