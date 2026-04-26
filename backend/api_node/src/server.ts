import crypto from 'node:crypto';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { env, type AppEnv, resolveCorsOrigins } from './config/env.js';
import {
  InMemoryAuditLogWriter,
  type AuditLogWriter,
} from './core/audit/audit-log-writer.js';
import { createLoggerConfig } from './core/logging/logger.js';
import {
  InMemoryIdempotencyStore,
  type IdempotencyStore,
} from './core/resilience/idempotency-store.js';
import { createFirebaseClients } from './integrations/firebase/admin-app.js';
import {
  type AuthVerifier,
  type VerifiedIdentity,
} from './middlewares/authentication.middleware.js';
import { errorHandler } from './middlewares/error-handler.js';
import { requestContextMiddleware } from './middlewares/request-context.middleware.js';
import { FirestoreUserRepository } from './modules/users/infrastructure/firestore-user.repository.js';
import { InMemoryUserRepository } from './modules/users/infrastructure/in-memory-user.repository.js';
import type { UserRepository } from './modules/users/application/user-repository.js';
import { UserService } from './modules/users/application/user-service.js';
import { registerRoutes } from './routes/register-routes.js';

class FirebaseAuthVerifier implements AuthVerifier {
  constructor(
    private readonly verify: (idToken: string) => Promise<VerifiedIdentity>,
    private readonly healthCheck: () => Promise<void>,
  ) {}

  async verifyIdToken(idToken: string) {
    return this.verify(idToken);
  }

  async isReady() {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }
}

class UnavailableAuthVerifier implements AuthVerifier {
  async verifyIdToken(_idToken: string): Promise<VerifiedIdentity> {
    throw new Error('Firebase Auth ainda nao foi configurado para este ambiente.');
  }

  async isReady() {
    return false;
  }
}

export type AppDependencies = {
  env: AppEnv;
  authVerifier: AuthVerifier;
  userRepository: UserRepository;
  auditLogWriter: AuditLogWriter;
  idempotencyStore: IdempotencyStore;
  userService: UserService;
};

type DependencyOverrides = Partial<
  Omit<AppDependencies, 'userService' | 'env'>
> & {
  env?: Partial<AppEnv>;
};

export function createDependencies(
  overrides: DependencyOverrides = {},
): AppDependencies {
  const resolvedEnv: AppEnv = {
    ...env,
    ...overrides.env,
  };

  const needsFirebase = resolvedEnv.DATA_MODE === 'firebase';
  const firebaseClients = needsFirebase
    ? createFirebaseClients(resolvedEnv)
    : null;

  const authVerifier =
    overrides.authVerifier ??
    (firebaseClients
      ? new FirebaseAuthVerifier(
          async (idToken) => {
            const decoded = await firebaseClients.auth.verifyIdToken(idToken);

            return {
              uid: decoded.uid,
              email: decoded.email,
              tenantId: String(decoded.tenantId ?? ''),
              roleKeys: Array.isArray(decoded.roleKeys)
                  ? decoded.roleKeys.map(String)
                  : [],
              permissionKeys: Array.isArray(decoded.permissionKeys)
                  ? decoded.permissionKeys.map(String)
                  : [],
              moduleKeys: Array.isArray(decoded.moduleKeys)
                  ? decoded.moduleKeys.map(String)
                  : [],
            };
          },
          async () => {
            try {
              await firebaseClients.auth.getUser('healthcheck-user');
            } catch (error) {
              const code =
                typeof error === 'object' &&
                error !== null &&
                'code' in error
                  ? String(error.code)
                  : '';

              if (code !== 'auth/user-not-found') {
                throw error;
              }
            }
          },
        )
      : new UnavailableAuthVerifier());

  const userRepository =
    overrides.userRepository ??
    (resolvedEnv.DATA_MODE === 'firebase' && firebaseClients
      ? new FirestoreUserRepository(firebaseClients.firestore)
      : new InMemoryUserRepository());

  const auditLogWriter = overrides.auditLogWriter ?? new InMemoryAuditLogWriter();
  const idempotencyStore =
    overrides.idempotencyStore ?? new InMemoryIdempotencyStore();
  const userService = new UserService(
    userRepository,
    idempotencyStore,
    auditLogWriter,
  );

  return {
    env: resolvedEnv,
    authVerifier,
    userRepository,
    auditLogWriter,
    idempotencyStore,
    userService,
  };
}

export async function buildServer(
  dependencyOverrides: DependencyOverrides = {},
) {
  const dependencies = createDependencies(dependencyOverrides);

  const app = Fastify({
    logger: createLoggerConfig(dependencies.env),
    bodyLimit: dependencies.env.BODY_LIMIT_BYTES,
    genReqId: () => `req-${crypto.randomUUID()}`,
  });

  await app.register(cors, {
    origin: resolveCorsOrigins(dependencies.env.CORS_ORIGIN),
    credentials: true,
  });

  await app.register(helmet);
  await app.register(rateLimit, {
    max: dependencies.env.RATE_LIMIT_MAX,
    timeWindow: dependencies.env.RATE_LIMIT_WINDOW_MS,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'EixoOne API',
        version: '1.0.0',
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.addHook('onRequest', requestContextMiddleware);
  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        correlationId: request.context.correlationId,
        requestId: request.context.requestId,
        statusCode: reply.statusCode,
        userId: request.auth?.uid,
        tenantId: request.auth?.tenantId,
        latencyMs: reply.elapsedTime,
      },
      'request_completed',
    );
  });

  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Rota nao encontrada.',
        details: [],
      },
      meta: {
        contractVersion: 'v1',
        correlationId: request.context.correlationId,
        requestId: request.context.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  await registerRoutes(app, dependencies);

  return app;
}
