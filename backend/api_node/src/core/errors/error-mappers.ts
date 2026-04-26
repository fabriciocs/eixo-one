import { ZodError } from 'zod';

import { AppError, type AppErrorDetail } from './app-error.js';

export function appErrorFromZodError(error: ZodError) {
  const details: AppErrorDetail[] = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return new AppError(400, 'VALIDATION_ERROR', 'Payload invalido.', details);
}

