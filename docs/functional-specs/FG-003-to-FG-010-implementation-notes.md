# FG-003 a FG-010 — notas de aplicação

Implementação incremental para o monorepo EixoOne com contratos compartilhados, backend Fastify e Flutter.

## Aplicação

1. Exportar `packages/shared_contracts/src/v1/base-governance/index.ts` no índice principal de contratos.
2. Registrar `registerBaseGovernanceRoutes(app)` no registro de rotas do backend.
3. Conectar autenticação, autorização, validação e envelope de resposta conforme padrão existente.
4. Substituir o repositório em memória por persistência Firestore seguindo o padrão do módulo `governance`.
5. Registrar as telas Flutter no roteador e conectar providers conforme padrão de `features/governance`.

## Validação

Executar validações Node e Flutter antes do merge:

```bash
npm install
npm run build
npm run lint
npm run typecheck
npm run test
cd apps/mobile_flutter
flutter pub get
flutter analyze
flutter test
```
