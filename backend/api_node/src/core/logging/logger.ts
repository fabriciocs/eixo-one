import type { FastifyServerOptions } from 'fastify';

import type { AppEnv } from '../../config/env.js';

export function createLoggerConfig(env: AppEnv): FastifyServerOptions['logger'] {
  return {
    level: env.LOG_LEVEL,
    base: {
      service: 'eixoone-api',
      environment: env.APP_ENV,
    },
    transport:
      env.APP_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          id: request.id,
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
  };
}

