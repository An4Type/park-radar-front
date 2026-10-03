import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          failureCount < 2 && !(isApiError(error) && (error.kind === 'not-found' || error.kind === 'invalid-response')),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
}
