import { AppError } from '../errors/app-error.js';

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Tempo limite excedido.',
) {
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AppError(504, 'TIMEOUT', message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

