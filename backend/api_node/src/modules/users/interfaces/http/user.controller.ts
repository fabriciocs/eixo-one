import {
  changeUserStatusBodySchema,
  changeUserStatusCommandSchema,
  listUsersQuerySchema,
} from '@eixoone/shared-contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { sendSuccess } from '../../../../core/contracts/http-response.js';
import type { AppDependencies } from '../../../../server.js';

const userParamsSchema = z.object({
  userId: z.string().trim().min(3).max(128),
});

export function createUserController(dependencies: AppDependencies) {
  return {
    me: async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await dependencies.userService.getMe(
        request.auth!.tenantId,
        request.auth!.uid,
      );

      return sendSuccess(request, reply, user);
    },
    list: async (request: FastifyRequest, reply: FastifyReply) => {
      const query = listUsersQuerySchema.parse({
        ...(request.query as Record<string, unknown>),
        tenantId: request.auth!.tenantId,
      });
      const result = await dependencies.userService.listUsers(query);

      return sendSuccess(
        request,
        reply,
        {
          items: result.items,
        },
        {
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            totalItems: result.totalItems,
            hasNextPage: result.hasNextPage,
          },
        },
      );
    },
    changeStatus: async (request: FastifyRequest, reply: FastifyReply) => {
      const params = userParamsSchema.parse(request.params);
      const body = changeUserStatusBodySchema.parse(request.body);
      const idempotencyKey = String(
        request.headers['x-idempotency-key'] ?? '',
      ).trim();

      const command = changeUserStatusCommandSchema.parse({
        ...body,
        userId: params.userId,
        actorUserId: request.auth!.uid,
        tenantId: request.auth!.tenantId,
        idempotencyKey,
      });

      const { result, replayed } = await dependencies.userService.changeUserStatus(
        command,
        request.context,
      );

      if (replayed) {
        reply.header('x-idempotency-replayed', 'true');
      }

      return sendSuccess(request, reply, result, {
        idempotencyReplayed: replayed,
      });
    },
  };
}
