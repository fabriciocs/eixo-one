import { describe, expect, it, vi } from 'vitest';

import { withRetry } from '../core/resilience/retry.js';

describe('withRetry', () => {
  it('retries temporary failures and eventually resolves', async () => {
    const action = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('ok');

    const result = await withRetry(action, {
      retries: 2,
      baseDelayMs: 1,
      maxDelayMs: 1,
    });

    expect(result).toBe('ok');
    expect(action).toHaveBeenCalledTimes(2);
  });
});
