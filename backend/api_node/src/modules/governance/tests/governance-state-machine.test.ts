import { describe, expect, it } from 'vitest';

import { AppError } from '../../../core/errors/app-error.js';
import {
  resolveConsolidationRunTransition,
  resolveGovernanceStatusTransition,
} from '../domain/governance-state-machine.js';

describe('governance state machine', () => {
  it('allows draft company activation', () => {
    expect(resolveGovernanceStatusTransition('draft', 'activate')).toBe('active');
  });

  it('blocks invalid governance transitions', () => {
    expect(() =>
      resolveGovernanceStatusTransition('archived', 'activate'),
    ).toThrowError(AppError);
  });

  it('allows queued consolidation run to start processing', () => {
    expect(resolveConsolidationRunTransition('queued', 'startProcessing')).toBe(
      'processing',
    );
  });

  it('blocks invalid consolidation transitions', () => {
    expect(() =>
      resolveConsolidationRunTransition('completed', 'reprocess'),
    ).toThrowError(AppError);
  });
});
