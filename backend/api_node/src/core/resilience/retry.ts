export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

function defaultShouldRetry(error: unknown) {
  return error instanceof Error;
}

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function withRetry<T>(
  action: () => Promise<T>,
  options: RetryOptions = {},
) {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 1000;
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  let attempt = 0;

  while (true) {
    try {
      return await action();
    } catch (error) {
      attempt += 1;

      if (attempt > retries || !shouldRetry(error, attempt)) {
        throw error;
      }

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(backoff);
    }
  }
}

