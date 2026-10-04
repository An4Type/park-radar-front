import { env } from '@/config/env';
import { httpParkingApi } from './http/httpParkingApi';
import type { ParkingApi } from './types';

function createBackend(): Promise<ParkingApi> {
  if (env.apiMode === 'http') return Promise.resolve(httpParkingApi);
  return import('./mock/mockParkingApi').then(({ createMockParkingApi }) => {
    const local = createMockParkingApi();
    if (env.apiMode === 'mock') return local;
    return {
      getSnapshot: httpParkingApi.getSnapshot,
      searchDestinations: local.searchDestinations,
      getRoute: local.getRoute,
    };
  });
}

const backend = createBackend();

export const parkingApi: ParkingApi = {
  getSnapshot: (params, signal) => backend.then((api) => api.getSnapshot(params, signal)),
  searchDestinations: (params, signal) => backend.then((api) => api.searchDestinations(params, signal)),
  getRoute: (params, signal) => backend.then((api) => api.getRoute(params, signal)),
};

export * from './types';
export { ApiError, isApiError } from './errors';
export { queryKeys } from './queryKeys';
