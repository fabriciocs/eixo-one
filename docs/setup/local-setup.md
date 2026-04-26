# EixoOne Setup Local

## 3. Comandos de preparacao do ambiente

### Verificar ferramentas

#### macOS/Linux

```bash
flutter --version
dart --version
node --version
npm --version
firebase --version
java -version
```

#### Windows PowerShell

```powershell
flutter --version
dart --version
node --version
npm --version
firebase --version
java -version
```

Observacoes importantes:

- O `Firebase CLI` requer `Node.js 18+`
- O `Firebase Emulator Suite` pede `Node.js 16+` e `JDK 11+`
- Para `Cloud Functions`, prefira `Node 22 LTS` no projeto, mesmo que sua maquina tenha uma versao mais nova

#### macOS/Linux com nvm

```bash
nvm install 22
nvm use 22
node --version
```

#### Windows com nvm-windows

```powershell
nvm install 22.14.0
nvm use 22.14.0
node --version
```

### Criar o projeto Flutter

#### macOS/Linux

```bash
mkdir -p apps/mobile_flutter
cd apps/mobile_flutter
flutter create . --platforms=android,ios,web
```

#### Windows PowerShell

```powershell
New-Item -ItemType Directory -Force -Path apps/mobile_flutter | Out-Null
Set-Location apps/mobile_flutter
flutter create . --platforms=android,ios,web
```

### Instalar Firebase CLI

#### macOS/Linux

```bash
npm install -g firebase-tools
# alternativa oficial:
curl -sL https://firebase.tools | bash
```

#### Windows PowerShell

```powershell
npm install -g firebase-tools
```

### Autenticar no Firebase

```bash
firebase login
firebase projects:list
```

### Instalar FlutterFire CLI

#### macOS/Linux

```bash
dart pub global activate flutterfire_cli
export PATH="$PATH":"$HOME/.pub-cache/bin"
```

#### Windows PowerShell

```powershell
dart pub global activate flutterfire_cli
$env:Path += ';' + "$HOME\\AppData\\Local\\Pub\\Cache\\bin"
```

### Configurar Firebase no Flutter

Dentro de `apps/mobile_flutter`:

```bash
flutter pub add firebase_core firebase_auth cloud_firestore firebase_storage firebase_app_check firebase_crashlytics firebase_analytics
flutterfire configure
```

### Criar projeto Node.js com TypeScript

Dentro de `backend/api_node`:

```bash
npm init -y
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit firebase-admin zod dotenv pino
npm install -D typescript tsx @types/node vitest supertest eslint prettier
npx tsc --init
```

### Configurar Firebase Admin SDK

```bash
npm install firebase-admin
```

Em desenvolvimento local, prefira `GOOGLE_APPLICATION_CREDENTIALS` ou `applicationDefault()`; para ambientes controlados, injete o JSON da service account via segredo no servidor, nunca no app Flutter.

### Configurar emuladores Firebase

Na raiz do monorepo:

```bash
firebase init
firebase init emulators
firebase emulators:start
```

### Iniciar frontend e backend localmente

#### Frontend

```bash
cd apps/mobile_flutter
flutter pub get
flutter run -d chrome
```

#### Backend

```bash
cd backend/api_node
npx tsx src/app.ts
```

## 5. Configuracao Firebase

### Authentication

- habilitar `Email/Password` primeiro
- adicionar SSO depois, se necessario
- espelhar metadados operacionais do usuario em `users`

### Firestore

- usar modelo `organization-first`
- impedir colecoes abertas
- preferir `rules_version = '2'`

### Storage

- path sempre contextualizado por organizacao
- validar tipo e ownership

### Hosting

- publicar o build web do Flutter em `apps/mobile_flutter/build/web`
- para API, preferir dominio proprio em Cloud Run ou Functions

### App Check

- Android: `Play Integrity`
- Apple: `Device Check` ou `App Attest`
- Web: `reCAPTCHA v3`
- ambiente local: provider `debug`

### Crashlytics e Analytics

- habilitar no projeto Firebase
- adicionar plugins ao app antes de reexecutar `flutterfire configure`

### Cloud Functions

- usar `Node.js 20 ou 22` como baseline de runtime suportado
- limitar a casos pequenos, orientados a evento ou muito proximos do Firebase

### Emulator Suite

- usar `Auth`, `Firestore`, `Storage`, `Functions` e `Hosting` no desenvolvimento
- manter export/import de dados de dev quando o time crescer

### Arquivo
`firebase.json`

Arquivo real criado na raiz do repositorio.

### Arquivo
`.firebaserc`

Use o exemplo em `.firebaserc.example` e troque pelo `projectId` real.

### Arquivo
`firebase/rules/firestore.rules`

Arquivo real criado em `firebase/rules/firestore.rules`.

### Arquivo
`firebase/rules/storage.rules`

Arquivo real criado em `firebase/rules/storage.rules`.

### Arquivo
`.env.example`

Arquivo real criado na raiz do repositorio.

### Arquivo
`apps/mobile_flutter/lib/firebase_options.dart`

Este arquivo deve ser gerado automaticamente pelo `flutterfire configure`.

## Como executar localmente

1. Criar o app Flutter em `apps/mobile_flutter`
2. Criar a API em `backend/api_node`
3. Rodar `flutter pub add ...` e `flutterfire configure`
4. Ajustar `.firebaserc` com o projeto correto
5. Rodar `firebase emulators:start`
6. Subir o backend com `npx tsx src/app.ts`
7. Subir o frontend com `flutter run -d chrome`

## Como testar

### Frontend

```bash
cd apps/mobile_flutter
flutter analyze
flutter test
```

### Backend

```bash
cd backend/api_node
npx tsc --noEmit
npx vitest run
```

### Integracao local

```bash
firebase emulators:start
curl http://localhost:4000/health
```

Validacoes minimas:

- login cria sessao Firebase
- `/health` responde `ok`
- `/me` responde `401` sem token
- `/me` responde perfil com token valido
- Rules bloqueiam acesso cross-tenant

## Como fazer o primeiro deploy

### Web Flutter no Firebase Hosting

```bash
cd apps/mobile_flutter
flutter build web
cd ../..
firebase deploy --only hosting
```

### Backend em Cloud Run

- containerizar a API
- configurar segredos
- expor URL HTTPS
- restringir CORS por dominio oficial

### Backend em Cloud Functions

- use quando o backend comecar pequeno e orientado a eventos
- deploy por `firebase deploy --only functions`

## Checklist de execucao

- [ ] Projeto Firebase criado
- [ ] `.firebaserc` ajustado
- [ ] `flutterfire configure` executado
- [ ] Auth habilitado
- [ ] Firestore criado
- [ ] Storage criado
- [ ] App Check configurado
- [ ] Emuladores inicializados
- [ ] API sobe em `:4000`
- [ ] Frontend sobe em `chrome`
- [ ] `/health` validado
- [ ] Rules publicadas

## Riscos e decisoes pendentes

- definir se a API principal nasce em `Cloud Run` ou `Cloud Functions`
- definir estrategia de multi-organizacao por usuario
- decidir se papeis finos ficam so em Firestore ou parcialmente em custom claims
- definir convencao de contratos compartilhados em `packages/shared_contracts`
- fechar estrategia de auditoria detalhada e retencao
- decidir naming definitivo de modulos e chaves de permissao

## Proximos passos

1. Scaffold real do app Flutter
2. Scaffold real da API Node.js
3. Criar fluxo de login com Firebase Auth
4. Conectar app aos emuladores
5. Implementar `AppShell`, `Dashboard` e `Select Organization`
6. Criar middleware de permissao por modulo
7. Definir primeiros indices do Firestore
8. Subir pipeline CI basico

## Referencias oficiais

- FlutterFire CLI e `firebase_options.dart`: https://firebase.google.com/docs/flutter/setup
- Firebase CLI e login: https://firebase.google.com/docs/cli
- Emulator Suite: https://firebase.google.com/docs/emulator-suite/install_and_configure
- App Check em Flutter: https://firebase.google.com/docs/app-check/flutter/default-providers
- Admin SDK: https://firebase.google.com/docs/admin/setup
- Verify ID Token: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firestore Rules: https://firebase.google.com/docs/firestore/security/get-started
- Cloud Functions runtime: https://firebase.google.com/docs/functions/get-started
