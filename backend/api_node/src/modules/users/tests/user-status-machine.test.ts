import { describe, expect, it } from 'vitest';

import {
  assertValidUserStatusTransition,
  listAllowedUserStatusTransitions,
} from '../domain/user-status-machine.js';

describe('user status machine', () => {
  it('allows invited users to become active', () => {
    expect(() =>
      assertValidUserStatusTransition('invited', 'active'),
    ).not.toThrow();
  });

  it('blocks archived users from returning to active', () => {
    expect(() =>
      assertValidUserStatusTransition('archived', 'active'),
    ).toThrowError(/Transicao invalida/);
  });

  it('exposes allowed transitions for documentation and UI guards', () => {
    expect(listAllowedUserStatusTransitions('suspended')).toEqual([
      'active',
      'archived',
    ]);
  });
});

