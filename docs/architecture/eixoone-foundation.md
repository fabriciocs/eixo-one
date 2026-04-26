# EixoOne Foundation Blueprint

## 1. Visao geral da arquitetura

### Recomendacao

- `Flutter` como app principal, com UI responsiva, navecacao por paginas e componentes reutilizaveis
- `Firebase` como BaaS para autenticacao, Firestore, Storage, Hosting, Analytics, Crashlytics, App Check e emuladores
- `Node.js + TypeScript` como camada de negocio sensivel, integracoes, validacoes, webhooks e orquestracoes
- `Firebase Admin SDK` apenas no backend para operacoes privilegiadas
- `Cloud Functions` quando a unidade de deploy for pequena, orientada a eventos ou colada ao ecossistema Firebase
- `Cloud Run` quando a API precisar de container dedicado, maior controle de runtime, processamento mais pesado ou varias dependencias externas

### Desenho logico

```text
Flutter App
  -> Firebase Auth
  -> Firestore / Storage / Analytics / Crashlytics / App Check
  -> API Node.js (HTTPS)

API Node.js
  -> Firebase Admin SDK
  -> Firestore
  -> Auth verification
  -> Integrations / Webhooks / Audit

Firebase
  -> Security Rules
  -> Hosting
  -> Emulator Suite
```

### Quando usar acesso direto do Flutter ao Firebase

Use para:

- leitura de dados operacionais de baixa sensibilidade
- escrita simples e previsivel
- estados em tempo real
- upload/download de arquivos autorizados
- sessao do usuario, preferencia e notificacoes de baixa criticidade

Exemplos:

- dashboard com KPIs ja agregados
- lista de clientes da organizacao
- configuracoes pessoais do usuario
- anexos permitidos por regra

### Quando chamar a API Node.js

Use para:

- calculos financeiros e fiscais
- operacoes multi-etapas com consistencia de negocio
- integracoes com ERP, gateway, NFe, webhook e servicos externos
- validacoes sensiveis que nao podem confiar no cliente
- auditoria obrigatoria
- consolidacoes, jobs e automacoes

Exemplos:

- fechar venda
- aprovar compra
- alterar permissao de usuario
- processar importacao
- emitir documento fiscal

### Quando usar Cloud Functions

Use para:

- gatilhos do Firestore/Auth/Storage
- funcoes pequenas e proximas do Firebase
- webhooks simples
- tarefas assicronas pontuais

### Quando usar Cloud Run

Use para:

- API HTTP maior e modular
- integracoes complexas
- pipelines com bibliotecas nativas ou tempos de execucao maiores
- backend com observabilidade e deploy independente

### Papel das Firestore Security Rules

As rules sao a primeira linha de defesa para clientes mobile/web.

Use Rules para:

- restringir leitura e escrita por autenticacao
- limitar acesso por organizacao
- validar ownership e estados simples
- impedir acesso cross-tenant

Nao use Rules como unica camada para:

- regra de negocio complexa
- autorizacao baseada em varios documentos e side effects
- operacoes financeiras e fiscais

### Papel da validacao no backend

Toda API Node.js deve:

- verificar Firebase ID Token
- carregar contexto do usuario e organizacao
- validar schema de entrada
- validar permissao por papel, escopo e modulo
- aplicar regra de negocio
- registrar auditoria quando a acao for critica

## 2. Estrutura de pastas

### Monorepo

```text
/eixoone
  /apps
    /mobile_flutter
      /lib
        /app
          /router
        /core
          /config
          /firebase
          /layout
          /theme
        /design_system
          /components
          /tokens
        /features
          /auth
          /dashboard
          /users
          /roles
          /audit
        /shared
          /models
          /widgets
          /states
          /services
          /repositories
  /backend
    /api_node
      /src
        /config
        /auth
        /errors
        /integrations
        /middlewares
        /modules
          /users
            /controllers
            /services
            /repositories
            /routes
            /validators
        /routes
        /tests
  /firebase
    /rules
    /emulators
  /docs
    /architecture
    /ux-ui
    /setup
  /packages
    /shared_contracts
```

### Convencoes Flutter

- `features/` organiza por dominio, nao por tipo tecnico
- `core/` concentra bootstrap, config, firebase, tema e shell
- `design_system/` concentra tokens e componentes base
- `shared/` concentra contratos e utilitarios reutilizaveis
- `repositories/` abstraem origem dos dados
- `states/` gerenciam estado sem acoplar UI a regra de negocio

### Convencoes Node.js

- `modules/` organiza por contexto de negocio
- `controllers/` recebem request e devolvem response
- `services/` concentram casos de uso
- `repositories/` abstraem Firestore e fontes externas
- `middlewares/` cuidam de auth, validacao, rate limit e erro
- `integrations/` isolam SDKs e provedores externos

## 4. Dependencias iniciais recomendadas

### Flutter

- Firebase: `firebase_core`, `firebase_auth`, `cloud_firestore`, `firebase_storage`, `firebase_app_check`, `firebase_crashlytics`, `firebase_analytics`
- Estado: `flutter_riverpod`
- Rotas: `go_router`
- Validacao: `form_builder_validators`
- Internacionalizacao: `intl`, `flutter_localizations`
- Responsividade: `flutter_screenutil` ou utilitarios proprios por breakpoint
- DI: em apps menores, o proprio Riverpod costuma bastar; se precisar, `get_it` apenas no backend-like layer

### Node.js

- HTTP: `fastify` ou `express`
- TypeScript: `typescript`, `tsx`, `tsup` ou `tsc`
- Firebase: `firebase-admin`
- Schema: `zod`
- Seguranca: `helmet`, `cors`, `@fastify/rate-limit` ou `express-rate-limit`
- Logging: `pino`, `pino-http`
- Ambiente: `dotenv`
- Testes: `vitest`, `supertest`
- Qualidade: `eslint`, `prettier`
- OpenAPI: `@fastify/swagger` ou `swagger-ui-express`

### Escolha recomendada

- `Flutter + Riverpod + go_router`
- `Fastify + TypeScript + Zod + Pino`

Motivo: menos boilerplate, tipagem boa, performance suficiente e estrutura limpa para modularizacao.

## 6. Seguranca inicial obrigatoria

- Nunca expor service account ou credenciais administrativas no app Flutter
- Usar `Firebase Admin SDK` somente no backend
- Verificar `Firebase ID Token` em toda rota protegida
- Aplicar autorizacao por `organizationId`, `roleIds`, `permissionKeys` e `moduleKeys`
- Usar `custom claims` para sinalizadores globais e papeis resumidos; detalhes finos continuam em banco
- Proteger Firestore e Storage com `Security Rules`
- Ativar `App Check` para dificultar abuso dos recursos Firebase
- Validar toda entrada com schema no backend
- Aplicar `rate limit`, `helmet` e `cors` por ambiente
- Registrar auditoria em acoes criticas: login sensivel, alteracao de papel, exclusao, aprovacao, integracao
- Seguir `OWASP API Security Top 10`
- Nao confiar em permissao somente no frontend

## 8. Backend Node.js

### Arquivo
`backend/api_node/src/server.ts`

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { registerRoutes } from './routes';
import { errorHandler } from './middlewares/error.middleware';

export function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(helmet);
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.setErrorHandler(errorHandler);
  registerRoutes(app);

  return app;
}
```

### Arquivo
`backend/api_node/src/app.ts`

```ts
import { buildServer } from './server';

async function bootstrap() {
  const app = buildServer();

  await app.listen({
    host: '0.0.0.0',
    port: Number(process.env.PORT ?? 4000),
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### Arquivo
`backend/api_node/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

### Arquivo
`backend/api_node/src/config/firebase-admin.ts`

```ts
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function createFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  return initializeApp({
    credential: serviceAccountJson
      ? cert(JSON.parse(serviceAccountJson))
      : applicationDefault(),
  });
}

const firebaseAdminApp = createFirebaseAdminApp();

export const adminAuth = getAuth(firebaseAdminApp);
export const adminDb = getFirestore(firebaseAdminApp);
```

### Arquivo
`backend/api_node/src/middlewares/auth.middleware.ts`

```ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { adminAuth } from '../config/firebase-admin';

export type AuthContext = {
  uid: string;
  email?: string;
  organizationId?: string;
  roles?: string[];
};

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Token ausente ou invalido.' });
  }

  const idToken = header.replace('Bearer ', '');
  const decoded = await adminAuth.verifyIdToken(idToken);

  request.auth = {
    uid: decoded.uid,
    email: decoded.email,
    organizationId: typeof decoded.organizationId === 'string' ? decoded.organizationId : undefined,
    roles: Array.isArray(decoded.roles) ? decoded.roles.map(String) : [],
  };
}
```

### Arquivo
`backend/api_node/src/middlewares/error.middleware.ts`

```ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const statusCode = Number((error as FastifyError & { statusCode?: number }).statusCode ?? 500);

  reply.status(statusCode).send({
    message: statusCode >= 500 ? 'Erro interno do servidor.' : error.message,
    code: error.name,
  });
}
```

### Arquivo
`backend/api_node/src/middlewares/validate.middleware.ts`

```ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeAny } from 'zod';

export function validateBody(schema: ZodTypeAny) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        message: 'Payload invalido.',
        issues: result.error.flatten(),
      });
    }

    request.body = result.data;
  };
}
```

### Arquivo
`backend/api_node/src/routes/index.ts`

```ts
import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getMeController } from '../modules/users/controllers/me.controller';

export function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'eixoone-api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/me', { preHandler: [authMiddleware] }, getMeController);

  app.get('/admin/example', { preHandler: [authMiddleware] }, async (request, reply) => {
    if (!request.auth?.roles?.includes('admin')) {
      return reply.status(403).send({ message: 'Acesso negado.' });
    }

    return { message: 'Rota protegida liberada.' };
  });
}
```

### Arquivo
`backend/api_node/src/modules/users/controllers/me.controller.ts`

```ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { userService } from '../services/user.service';

export async function getMeController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const uid = request.auth?.uid;

  if (!uid) {
    return reply.status(401).send({ message: 'Usuario nao autenticado.' });
  }

  const profile = await userService.getProfile(uid);

  return reply.send(profile);
}
```

### Arquivo
`backend/api_node/src/modules/users/services/user.service.ts`

```ts
import { userRepository } from '../repositories/user.repository';

class UserService {
  async getProfile(uid: string) {
    return userRepository.findByUid(uid);
  }
}

export const userService = new UserService();
```

### Arquivo
`backend/api_node/src/modules/users/repositories/user.repository.ts`

```ts
import { adminDb } from '../../../config/firebase-admin';

class UserRepository {
  async findByUid(uid: string) {
    const snapshot = await adminDb.collection('users').doc(uid).get();

    if (!snapshot.exists) {
      return {
        uid,
        exists: false,
      };
    }

    return {
      uid,
      exists: true,
      ...snapshot.data(),
    };
  }
}

export const userRepository = new UserRepository();
```

## 9. Modelo inicial de dados Firestore

### `organizations`

- Campos: `name`, `slug`, `status`, `moduleKeys`, `ownerUserId`, `createdAt`, `updatedAt`
- Indices provaveis: `slug`, `status + createdAt`
- Acesso: usuario so le a propria organizacao; alteracoes sensiveis via backend
- Observacao: raiz de tenancy

### `users`

- Campos: `organizationIds`, `defaultOrganizationId`, `displayName`, `email`, `photoUrl`, `status`, `roleIds`, `permissionKeys`, `lastLoginAt`
- Indices provaveis: `email`, `defaultOrganizationId + status`
- Acesso: usuario le proprio perfil; administracao de usuarios via backend
- Observacao: manter espelho do Auth para consultas operacionais

### `roles`

- Campos: `organizationId`, `name`, `key`, `permissionKeys`, `isSystem`, `createdAt`
- Indices provaveis: `organizationId + key`
- Acesso: leitura para usuarios autorizados; escrita via backend
- Observacao: preferir chaves estaveis

### `permissions`

- Campos: `moduleKey`, `key`, `label`, `description`, `scope`
- Indices provaveis: `moduleKey + key`
- Acesso: leitura ampla autenticada; escrita restrita a sistema
- Observacao: catalogo central

### `modules`

- Campos: `key`, `label`, `enabled`, `route`, `icon`, `order`
- Indices provaveis: `enabled + order`
- Acesso: leitura autenticada
- Observacao: define navegacao e feature flags

### `audit_logs`

- Campos: `organizationId`, `actorUid`, `action`, `entityType`, `entityId`, `before`, `after`, `metadata`, `createdAt`
- Indices provaveis: `organizationId + createdAt`, `actorUid + createdAt`, `entityType + entityId`
- Acesso: somente administradores e auditoria
- Observacao: preferir escrita pelo backend

### `settings`

- Campos: `organizationId`, `namespace`, `data`, `updatedAt`, `updatedBy`
- Indices provaveis: `organizationId + namespace`
- Acesso: leitura por escopo; escrita via backend

### `notifications`

- Campos: `organizationId`, `userId`, `type`, `title`, `body`, `status`, `readAt`, `createdAt`
- Indices provaveis: `userId + status + createdAt`
- Acesso: usuario le apenas as proprias

### `files`

- Campos: `organizationId`, `path`, `name`, `contentType`, `size`, `uploadedBy`, `createdAt`, `entityType`, `entityId`
- Indices provaveis: `organizationId + entityType + entityId`
- Acesso: conforme ownership e modulo

### `integrations`

- Campos: `organizationId`, `provider`, `status`, `configMasked`, `lastSyncAt`, `lastError`
- Indices provaveis: `organizationId + provider`
- Acesso: leitura restrita; escrita apenas backend

## 10. Fluxo inicial do usuario

1. Usuario abre o app
2. App carrega splash e verifica sessao Firebase
3. Se nao autenticado, vai para `/login`
4. Apos login, app carrega organizacoes disponiveis
5. Se houver mais de uma, vai para `/select-organization`
6. App carrega papeis, permissoes e modulos habilitados
7. Usuario entra em `/dashboard`
8. Navegacao principal usa shell responsivo por paginas, sem depender de modais
9. Acoes sensiveis chamam backend Node.js
10. Acoes criticas geram `audit_logs`
11. Erros aparecem inline, proximos ao contexto
12. Feedback usa banners, snackbars curtos e estados de pagina

## 11. Estrategia de rotas e paginas

### Rotas iniciais

- `/splash`
- `/login`
- `/forgot-password`
- `/select-organization`
- `/dashboard`
- `/modules`
- `/settings`
- `/profile`
- `/users`
- `/roles`
- `/audit`
- `/notifications`

### Diretriz de UX

- Fluxos principais por paginas ou paines laterais
- Confirmacoes preferencialmente por pagina de revisao, painel inline ou etapa final
- `Bottom sheet` apenas para acoes contextuais de baixa criticidade
- Modais fora do caminho principal

## 12. Criterios de aceite

- [ ] App Flutter inicia sem erro apos gerar `firebase_options.dart`
- [ ] `Firebase.initializeApp()` executa com configuracao valida
- [ ] Login Firebase esta preparado
- [ ] Tema Material 3 aplicado
- [ ] Navegacao inicial funciona
- [ ] Backend Node.js inicia localmente
- [ ] `/health` responde `200`
- [ ] Rota protegida valida ID Token
- [ ] `firestore.rules` e `storage.rules` existem
- [ ] Emuladores Firebase configurados
- [ ] `.env.example` documentado
- [ ] README explica setup local
- [ ] Estrutura suporta multiplos modulos
- [ ] Design system separado da regra de negocio

## 13. Entregaveis esperados

- plano de arquitetura
- arvore de diretorios
- comandos de terminal
- arquivos de configuracao
- exemplos de codigo
- README inicial
- checklist de execucao
- proximos passos recomendados
