# Setup Local

## Ferramentas

### macOS/Linux

```bash
node --version
npm --version
flutter --version
firebase --version
java -version
```

### Windows PowerShell

```powershell
node --version
npm --version
flutter --version
firebase --version
java -version
```

## Node recomendado

```bash
nvm install 22.14.0
nvm use 22.14.0
```

## Instalar dependencias

### Node workspaces

```bash
npm install
```

### Flutter

```bash
cd apps/mobile_flutter
flutter pub get
```

Se os arquivos Firebase do app nao existirem ou estiverem desatualizados, reexecute:

```bash
cd apps/mobile_flutter
flutterfire configure --project=eixoone-dev --platforms=android,ios,web
```

## Arquivos de ambiente

```bash
cp .env.example .env
cp .firebaserc.example .firebaserc
```

## Modo local rapido

Use `DATA_MODE=memory` para validar fluxo sem Firebase real.

## Modo com emuladores Firebase

```bash
firebase emulators:start
```

Configure:

```text
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8088
STORAGE_EMULATOR_HOST=127.0.0.1:9199
DATA_MODE=firebase
```

Suba os emuladores pelo script do monorepo:

```bash
npm run emulators:start
```

Semeie os dados locais antes de abrir o app ou a API:

```bash
npm run emulators:seed
```

## Subir a API

```bash
cd backend/api_node
npm run dev
```

## Subir o app

```bash
cd apps/mobile_flutter
flutter run -d chrome
```

O Flutter usa emuladores locais por padrao em `debug`. Para Android Emulator, o host padrao ja muda para `10.0.2.2`. Para dispositivo fisico, passe manualmente:

```bash
flutter run --dart-define=FIREBASE_EMULATOR_HOST=192.168.0.10
```

## Validar tudo

```bash
npm run validate
cd apps/mobile_flutter
flutter analyze
flutter test
```

### Validar integracao Flutter + Firebase

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gcloud\10-validate-flutter-firebase.ps1
```

### Validar rules e fluxo local contra emuladores

```bash
npm run test:emulators
```
