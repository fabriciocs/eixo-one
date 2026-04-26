import { changeUserStatusBodySchema, listUsersQuerySchema } from '@eixoone/shared-contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticationMiddleware } from '../middlewares/authentication.middleware.js';
import { authorizationMiddleware } from '../middlewares/authorization.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import type { AppDependencies } from '../server.js';
import { createUserController } from '../modules/users/interfaces/http/user.controller.js';

export async function registerRoutes(
  app: FastifyInstance,
  dependencies: AppDependencies,
) {
  const requireAuth = authenticationMiddleware(dependencies);
  const usersController = createUserController(dependencies);

  app.get('/health', async (_request, reply) => {
    reply.header('cache-control', 'no-store');

    return {
      status: 'ok',
      service: 'eixoone-api',
      environment: dependencies.env.APP_ENV,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  });

  app.get('/ready', async (_request, reply) => {
    const [authReady, repoReady, auditReady, idempotencyReady] = await Promise.all([
      dependencies.authVerifier.isReady(),
      dependencies.userRepository.isReady(),
      dependencies.auditLogWriter.isReady(),
      dependencies.idempotencyStore.isReady(),
    ]);

    const isReady = authReady && repoReady && auditReady && idempotencyReady;

    reply.code(isReady ? 200 : 503);

    return {
      status: isReady ? 'ready' : 'degraded',
      checks: {
        authVerifier: authReady,
        userRepository: repoReady,
        auditLogWriter: auditReady,
        idempotencyStore: idempotencyReady,
      },
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/v1/me', { preHandler: [requireAuth] }, usersController.me);

  app.get(
    '/v1/users',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware('users.read'),
        validateRequest({
          querystring: listUsersQuerySchema.omit({ tenantId: true }),
        }),
      ],
    },
    usersController.list,
  );

  app.post(
    '/v1/users/:userId/status',
    {
      preHandler: [
        requireAuth,
        authorizationMiddleware('users.manage'),
        validateRequest({
          params: z.object({
            userId: z.string().trim().min(3).max(128),
          }),
          body: changeUserStatusBodySchema,
        }),
      ],
    },
    usersController.changeStatus,
  );
}

