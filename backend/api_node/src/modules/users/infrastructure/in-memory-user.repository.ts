import type { UserStatus } from '@eixoone/shared-contracts';

import { AppError } from '../../../core/errors/app-error.js';
import type {
  ListUsersFilters,
  TransitionUserStatusInput,
  UserRepository,
} from '../application/user-repository.js';
import { parseUserEntity, type UserEntity } from '../domain/user.js';

const seedUsers: UserEntity[] = [
  parseUserEntity({
    id: 'user_admin',
    tenantId: 'tenant_demo',
    email: 'admin@eixo.one',
    displayName: 'Admin EixoOne',
    status: 'active',
    roleKeys: ['platform_admin'],
    permissionKeys: ['users.read', 'users.manage'],
    moduleKeys: ['dashboard', 'users', 'audit'],
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    lastLoginAt: '2026-04-26T18:10:00.000Z',
    version: 3,
  }),
  parseUserEntity({
    id: 'user_operator',
    tenantId: 'tenant_demo',
    email: 'operador@eixo.one',
    displayName: 'Operador',
    status: 'invited',
    roleKeys: ['operator'],
    permissionKeys: ['users.read'],
    moduleKeys: ['dashboard', 'users'],
    createdAt: '2026-04-25T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    lastLoginAt: null,
    version: 1,
  }),
];

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserEntity>(
    seedUsers.map((user) => [this.keyOf(user.tenantId, user.id), user]),
  );

  private keyOf(tenantId: string, userId: string) {
    return `${tenantId}:${userId}`;
  }

  async findById(tenantId: string, userId: string) {
    return this.users.get(this.keyOf(tenantId, userId)) ?? null;
  }

  async list(filters: ListUsersFilters) {
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const filteredItems = [...this.users.values()].filter((user) => {
      if (user.tenantId !== filters.tenantId) {
        return false;
      }

      if (filters.status && user.status !== filters.status) {
        return false;
      }

      if (normalizedSearch) {
        return (
          user.displayName.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch)
        );
      }

      return true;
    });

    const startIndex = (filters.page - 1) * filters.pageSize;
    const items = filteredItems.slice(startIndex, startIndex + filters.pageSize);

    return {
      items,
      totalItems: filteredItems.length,
      hasNextPage: startIndex + filters.pageSize < filteredItems.length,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async transitionStatus(input: TransitionUserStatusInput) {
    const key = this.keyOf(input.tenantId, input.userId);
    const current = this.users.get(key);

    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'Usuario nao encontrado.');
    }

    if (current.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'CONFLICT',
        'Versao do usuario desatualizada. Recarregue os dados.',
      );
    }

    const updated = parseUserEntity({
      ...current,
      status: input.targetStatus satisfies UserStatus,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    });

    this.users.set(key, updated);

    return updated;
  }

  async isReady() {
    return true;
  }
}

