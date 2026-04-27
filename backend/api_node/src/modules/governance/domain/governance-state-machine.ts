import type {
  ConsolidationRunStatus,
  GovernanceRecordStatus,
} from '@eixoone/shared-contracts';

import { AppError } from '../../../core/errors/app-error.js';

type GovernanceTransitionAction = 'activate' | 'inactivate' | 'archive';
type ConsolidationTransitionAction =
  | 'queue'
  | 'block'
  | 'startProcessing'
  | 'complete'
  | 'completeWithDivergences'
  | 'fail'
  | 'reprocess';

const governanceStatusTransitions: Record<
  GovernanceRecordStatus,
  Partial<Record<GovernanceTransitionAction, GovernanceRecordStatus>>
> = {
  draft: {
    activate: 'active',
  },
  active: {
    inactivate: 'inactive',
  },
  inactive: {
    activate: 'active',
    archive: 'archived',
  },
  archived: {},
};

const consolidationTransitions: Record<
  ConsolidationRunStatus,
  Partial<Record<ConsolidationTransitionAction, ConsolidationRunStatus>>
> = {
  draft: {
    queue: 'queued',
    block: 'blocked',
  },
  queued: {
    startProcessing: 'processing',
    block: 'blocked',
  },
  blocked: {
    reprocess: 'queued',
  },
  processing: {
    complete: 'completed',
    completeWithDivergences: 'completed_with_divergences',
    fail: 'failed',
  },
  completed: {},
  completed_with_divergences: {},
  failed: {
    reprocess: 'queued',
  },
};

function assertTransition<TStatus extends string, TAction extends string>(
  transitions: Record<TStatus, Partial<Record<TAction, TStatus>>>,
  currentStatus: TStatus,
  action: TAction,
) {
  const nextStatus = transitions[currentStatus]?.[action];

  if (!nextStatus) {
    throw new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      'A transicao de estado solicitada nao e permitida.',
    );
  }

  return nextStatus;
}

export function resolveGovernanceStatusTransition(
  currentStatus: GovernanceRecordStatus,
  action: GovernanceTransitionAction,
) {
  return assertTransition(governanceStatusTransitions, currentStatus, action);
}

export function resolveConsolidationRunTransition(
  currentStatus: ConsolidationRunStatus,
  action: ConsolidationTransitionAction,
) {
  return assertTransition(consolidationTransitions, currentStatus, action);
}
