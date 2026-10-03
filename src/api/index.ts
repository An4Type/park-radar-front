import { env } from '@/config/env';
import { httpParkingApi } from './http/httpParkingApi';
import type { ParkingApi } from './types';

const backend: Promise<ParkingApi> =
  env.apiMode === 'http'
    ? Promise.resolve(httpParkingApi)
    : import('./mock/mockParkingApi').then(({ createMockParkingApi }) => createMockParkingApi());

export const parkingApi: ParkingApi = {
  getSnapshot: (params, signal) => backend.then((api) => api.getSnapshot(params, signal)),
  searchDestinations: (params, signal) => backend.then((api) => api.searchDestinations(params, signal)),
  getRoute: (params, signal) => backend.then((api) => api.getRoute(params, signal)),
};

export * from './types';
export { ApiError, isApiError } from './errors';
export { queryKeys } from './queryKeys';
