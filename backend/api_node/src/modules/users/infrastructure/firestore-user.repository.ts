import {
  FieldPath,
  FieldValue,
  type Firestore,
} from 'firebase-admin/firestore';

import { AppError } from '../../../core/errors/app-error.js';
import type {
  ListUsersFilters,
  TransitionUserStatusInput,
  UserRepository,
} from '../application/user-repository.js';
import { parseUserEntity } from '../domain/user.js';

export class FirestoreUserRepository implements UserRepository {
  constructor(private readonly firestore: Firestore) {}

  private collection() {
    return this.firestore.collection('users');
  }

  async findById(tenantId: string, userId: string) {
    const snapshot = await this.collection().doc(userId).get();

    if (!snapshot.exists) {
      return null;
    }

    const parsed = parseUserEntity(snapshot.data());

    if (parsed.tenantId !== tenantId) {
      return null;
    }

    return parsed;
  }

  async list(filters: ListUsersFilters) {
    let query = this.collection().where('tenantId', '==', filters.tenantId);

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    query = query.orderBy('updatedAt', 'desc');

    const [countSnapshot, itemsSnapshot] = await Promise.all([
      query.count().get(),
      query
        .offset((filters.page - 1) * filters.pageSize)
        .limit(filters.pageSize)
        .get(),
    ]);

    const items = itemsSnapshot.docs
      .map((doc) => parseUserEntity(doc.data()))
      .filter((user) => {
        if (!filters.search) {
          return true;
        }

        const normalizedSearch = filters.search.toLowerCase();

        return (
          user.displayName.toLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch)
        );
      });

    const totalItems = countSnapshot.data().count;
    const startIndex = (filters.page - 1) * filters.pageSize;

    return {
      items,
      totalItems,
      hasNextPage: startIndex + items.length < totalItems,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async transitionStatus(input: TransitionUserStatusInput) {
    const result = await this.firestore.runTransaction(async (transaction) => {
      const documentReference = this.collection().doc(input.userId);
      const snapshot = await transaction.get(documentReference);

      if (!snapshot.exists) {
        throw new AppError(404, 'NOT_FOUND', 'Usuario nao encontrado.');
      }

      const current = parseUserEntity(snapshot.data());

      if (current.tenantId !== input.tenantId) {
        throw new AppError(404, 'NOT_FOUND', 'Usuario nao encontrado.');
      }

      if (current.version !== input.expectedVersion) {
        throw new AppError(
          409,
          'CONFLICT',
          'Versao do usuario desatualizada. Recarregue os dados.',
        );
      }

      transaction.update(documentReference, {
        status: input.targetStatus,
        updatedAt: new Date().toISOString(),
        version: FieldValue.increment(1),
      });

      return {
        ...current,
        status: input.targetStatus,
        updatedAt: new Date().toISOString(),
        version: current.version + 1,
      };
    });

    return parseUserEntity(result);
  }

  async isReady() {
    try {
      await this.firestore.collection('users').limit(1).select(FieldPath.documentId()).get();
      return true;
    } catch {
      return false;
    }
  }
}

