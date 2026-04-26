# Firebase Emulator Notes

Portas sugeridas para o EixoOne:

- Auth: `9099`
- Firestore: `8088`
- Storage: `9199`
- Functions: `5001`
- Hosting: `5000`
- Emulator UI: `4001`

Comando principal:

```bash
firebase emulators:start
```

Fluxo recomendado no monorepo:

```bash
npm run emulators:start
```

Em outro terminal:

```bash
npm run emulators:seed
npm run test:emulators
```

O seed local cria:

- usuarios no Auth Emulator;
- organizacoes e usuarios no Firestore Emulator;
- um arquivo CSV inicial no Storage Emulator.

Arquivos relacionados:

- `scripts/firebase/seed-emulators.mjs`
- `scripts/firebase/test-emulator-rules.mjs`
- `scripts/firebase/test-local-flow.mjs`
- `firebase/emulators/seed-files/tenant_demo_bootstrap.csv`
