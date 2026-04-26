# EixoOne

Gestao conectada. Decisoes claras.

Base inicial de arquitetura para um monorepo Flutter + Firebase + Node.js/TypeScript, com foco em mobile-first, modularidade, seguranca e evolucao por dominios de negocio.

## Estrutura alvo

```text
/eixoone
  /apps
    /mobile_flutter
  /backend
    /api_node
  /firebase
    /emulators
    /rules
  /docs
    /architecture
    /setup
    /ux-ui
  /packages
    /shared_contracts
```

## O que ja foi preparado

- Arquitetura inicial e diretrizes de decisao em `docs/architecture/eixoone-foundation.md`
- Setup local, comandos, teste e deploy em `docs/setup/local-setup.md`
- Base de design system e exemplos Flutter em `docs/ux-ui/design-system.md`
- Configuracoes iniciais do Firebase em `firebase.json`, `firebase/rules/firestore.rules`, `firebase/rules/storage.rules`
- Exemplos de ambiente em `.firebaserc.example` e `.env.example`

## Ferramentas verificadas neste ambiente

Em `2026-04-25`, este ambiente local respondeu com:

- Flutter `3.38.7`
- Dart `3.10.7`
- Node.js `24.11.1`
- npm `11.6.2`
- Firebase CLI `15.9.0`

Observacao: para `Cloud Functions`, a documentacao oficial atual suporta `Node.js 20` e `22`. Para manter paridade de runtime, vale fixar o projeto em `Node 22 LTS` via `nvm`, `fnm` ou `Volta`.

## Leitura recomendada

1. `docs/architecture/eixoone-foundation.md`
2. `docs/ux-ui/design-system.md`
3. `docs/setup/local-setup.md`

## Primeiro passo pratico

1. Criar o app Flutter dentro de `apps/mobile_flutter`
2. Criar a API Node.js dentro de `backend/api_node`
3. Executar `flutterfire configure`
4. Ajustar `.firebaserc` a partir de `.firebaserc.example`
5. Subir os emuladores Firebase
6. Validar login, `/health` e regras basicas

## Referencias oficiais usadas

- Firebase + Flutter setup: https://firebase.google.com/docs/flutter/setup
- Firebase CLI: https://firebase.google.com/docs/cli
- Firebase Emulator Suite: https://firebase.google.com/docs/emulator-suite/install_and_configure
- Firebase App Check para Flutter: https://firebase.google.com/docs/app-check/flutter/default-providers
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Verificacao de ID Token: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Cloud Functions for Firebase: https://firebase.google.com/docs/functions/get-started
