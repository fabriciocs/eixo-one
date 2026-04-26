import type { ErrorCode } from '@eixoone/shared-contracts';

type ErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export type AppErrorDetail = ErrorDetail;

