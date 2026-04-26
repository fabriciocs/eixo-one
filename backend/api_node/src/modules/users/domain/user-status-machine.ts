import type { UserStatus } from '@eixoone/shared-contracts';

import { AppError } from '../../../core/errors/app-error.js';

const allowedTransitions: Record<UserStatus, UserStatus[]> = {
  invited: ['active', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
};

export function assertValidUserStatusTransition(
  currentStatus: UserStatus,
  targetStatus: UserStatus,
) {
  if (currentStatus === targetStatus) {
    return;
  }

  if (!allowedTransitions[currentStatus].includes(targetStatus)) {
    throw new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      `Transicao invalida: ${currentStatus} -> ${targetStatus}.`,
    );
  }
}

export function listAllowedUserStatusTransitions(status: UserStatus) {
  return [...allowedTransitions[status]];
}

