# FG-008 — Integrações, API e webhooks

Entrega exemplar para o monorepo EixoOne quando o repositório real não foi fornecido.
 
Stack assumida a partir das planilhas recebidas:
- Backend: Node.js + TypeScript + Fastify em Cloud Run.
- Auth: Firebase Auth com custom claims.
- Dados: Firestore, Security Rules deny by default e índices compostos.
- Contratos compartilhados: `packages/sharedcontracts`.
- Frontend: Flutter mobile-first com Material 3, Riverpod e GoRouter.
- Controles: RBAC/ABAC, tenant isolation, auditoria, idempotência, rate limit e mascaramento de dados sensíveis.

## Como aplicar no repositório real

1. Copie as pastas preservando a estrutura relativa.
2. Troque os adaptadores em memória por Firestore/Admin SDK reais onde o projeto já tiver abstrações equivalentes.
3. Registre as rotas no bootstrap do Fastify.
4. Registre as rotas/telas Flutter no GoRouter/Riverpod existentes.
5. Execute os scripts do projeto real: lint, typecheck, test, build e emuladores Firebase quando existirem.

## Validações executáveis nesta entrega

```bash
npm run typecheck
npm run build
npm test
npm run validate:manifest
```

A entrega não inclui dependências, caches, builds finais no ZIP nem credenciais.
