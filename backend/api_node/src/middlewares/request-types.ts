import type { FastifyRequest } from 'fastify';

export type AuthContext = {
  uid: string;
  email?: string;
  tenantId: string;
  roleKeys: string[];
  permissionKeys: string[];
  moduleKeys: string[];
};

export type RequestContextData = {
  correlationId: string;
  requestId: string;
  receivedAt: string;
};

export type RequestContextState = FastifyRequest & {
  context: RequestContextData;
  auth?: AuthContext;
};

declare module 'fastify' {
  interface FastifyRequest {
    context: RequestContextData;
    auth?: AuthContext;
  }
}

