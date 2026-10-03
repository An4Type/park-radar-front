export type ApiErrorKind = 'network' | 'not-found' | 'server' | 'invalid-response' | 'aborted';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options?.status;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
