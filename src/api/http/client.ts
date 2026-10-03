import axios, { isAxiosError, isCancel } from 'axios';
import type { z } from 'zod';
import { env } from '@/config/env';
import { ApiError } from '../errors';

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
});

httpClient.interceptors.response.use(undefined, (error: unknown) => {
  if (isCancel(error)) {
    return Promise.reject(new ApiError('aborted', 'Request was cancelled', { cause: error }));
  }
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return Promise.reject(new ApiError('network', 'Network unavailable', { cause: error }));
    }
    if (status === 404) {
      return Promise.reject(new ApiError('not-found', 'Not found', { status, cause: error }));
    }
    return Promise.reject(new ApiError('server', `Server error ${status}`, { status, cause: error }));
  }
  return Promise.reject(error);
});

export async function getParsed<S extends z.ZodType>(
  url: string,
  schema: S,
  config?: { params?: Record<string, unknown>; signal?: AbortSignal },
): Promise<z.infer<S>> {
  const { data } = await httpClient.get<unknown>(url, config);
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError('invalid-response', `Unexpected response from ${url}`, { cause: result.error });
  }
  return result.data;
}
