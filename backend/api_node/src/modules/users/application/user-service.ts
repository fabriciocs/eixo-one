import type {
  ChangeUserStatusCommand,
  ListUsersQuery,
} from '@eixoone/shared-contracts';

import { auditEventSchema, contractVersion } from '@eixoone/shared-contracts';

import type { AuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { AppError } from '../../../core/errors/app-error.js';
import type {
  IdempotencyRecord,
  IdempotencyStore,
} from '../../../core/resilience/idempotency-store.js';
import type { RequestContextData } from '../../../middlewares/request-types.js';
import {
  assertValidUserStatusTransition,
} from '../domain/user-status-machine.js';
import type {
  PaginatedUsers,
  UserRepository,
} from './user-repository.js';

type ChangeUserStatusResult = {
  user: Awaited<ReturnType<UserRepository['transitionStatus']>>;
  transitionApplied: boolean;
};

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly idempotencyStore: IdempotencyStore,
    private readonly auditLogWriter: AuditLogWriter,
  ) {}

  async getMe(tenantId: string, userId: string) {
    const user = await this.userRepository.findById(tenantId, userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Usuario nao encontrado.');
    }

    return user;
  }

  async listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
    return this.userRepository.list(query);
  }

  async changeUserStatus(
    command: ChangeUserStatusCommand,
    requestContext: RequestContextData,
  ): Promise<{
    result: ChangeUserStatusResult;
    replayed: boolean;
  }> {
    const scope = `${command.tenantId}:${command.userId}:${command.idempotencyKey}`;
    const fingerprint = JSON.stringify(command);
    const existingRecord =
      await this.idempotencyStore.get<ChangeUserStatusResult>(scope);

    if (existingRecord) {
      if (existingRecord.fingerprint !== fingerprint) {
        throw new AppError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Chave de idempotencia reutilizada com payload diferente.',
        );
      }

      return {
        result: existingRecord.responseBody,
        replayed: true,
      };
    }

    const currentUser = await this.userRepository.findById(
      command.tenantId,
      command.userId,
    );

    if (!currentUser) {
      throw new AppError(404, 'NOT_FOUND', 'Usuario nao encontrado.');
    }

    assertValidUserStatusTransition(currentUser.status, command.targetStatus);

    const updatedUser = await this.userRepository.transitionStatus({
      tenantId: command.tenantId,
      userId: command.userId,
      expectedVersion: command.expectedVersion,
      targetStatus: command.targetStatus,
    });

    const result: ChangeUserStatusResult = {
      user: updatedUser,
      transitionApplied: true,
    };

    await this.auditLogWriter.write(
      auditEventSchema.parse({
        contractVersion,
        tenantId: command.tenantId,
        actorUserId: command.actorUserId,
        entityType: 'user',
        entityId: command.userId,
        action: 'user.status.changed',
        severity: 'warning',
        correlationId: requestContext.correlationId,
        requestId: requestContext.requestId,
        before: { status: currentUser.status, version: currentUser.version },
        after: { status: updatedUser.status, version: updatedUser.version },
        metadata: { reason: command.reason },
        createdAt: new Date().toISOString(),
      }),
    );

    const record: IdempotencyRecord<ChangeUserStatusResult> = {
      scope,
      fingerprint,
      statusCode: 200,
      responseBody: result,
      createdAt: new Date().toISOString(),
    };

    await this.idempotencyStore.set(record);

    return {
      result,
      replayed: false,
    };
  }
}

