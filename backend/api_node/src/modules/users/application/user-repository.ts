import type { UserStatus } from '@eixoone/shared-contracts';

import type { UserEntity } from '../domain/user.js';

export type ListUsersFilters = {
  tenantId: string;
  page: number;
  pageSize: number;
  status?: UserStatus;
  search?: string;
};

export type PaginatedUsers = {
  items: UserEntity[];
  totalItems: number;
  hasNextPage: boolean;
  page: number;
  pageSize: number;
};

export type TransitionUserStatusInput = {
  tenantId: string;
  userId: string;
  expectedVersion: number;
  targetStatus: UserStatus;
};

export interface UserRepository {
  findById(tenantId: string, userId: string): Promise<UserEntity | null>;
  list(filters: ListUsersFilters): Promise<PaginatedUsers>;
  transitionStatus(input: TransitionUserStatusInput): Promise<UserEntity>;
  isReady(): Promise<boolean>;
}

