import { env } from '@/config/env';
import { searchPlaces } from './geocoding/photon';
import { httpParkingApi } from './http/httpParkingApi';
import type { ParkingApi } from './types';

function createBackend(): Promise<ParkingApi> {
  if (env.apiMode === 'http') return Promise.resolve(httpParkingApi);
  return import('./mock/mockParkingApi').then(({ createMockParkingApi }) => {
    const local = createMockParkingApi();
    if (env.apiMode === 'mock') {
      return {
        ...local,
        searchDestinations: async (params, signal) => {
          const places = await searchPlaces(params.query, params.near, signal).catch(() => []);
          return places.length ? places : local.searchDestinations(params, signal);
        },
      };
    }
    return {
      getSnapshot: httpParkingApi.getSnapshot,
      searchDestinations: (params, signal) => searchPlaces(params.query, params.near, signal),
      getRoute: local.getRoute,
      getReports: httpParkingApi.getReports,
      submitReport: httpParkingApi.submitReport,
    };
  });
}

const backend = createBackend();

export const parkingApi: ParkingApi = {
  getSnapshot: (params, signal) => backend.then((api) => api.getSnapshot(params, signal)),
  searchDestinations: (params, signal) => backend.then((api) => api.searchDestinations(params, signal)),
  getRoute: (params, signal) => backend.then((api) => api.getRoute(params, signal)),
  getReports: (params, signal) => backend.then((api) => api.getReports(params, signal)),
  submitReport: (input) => backend.then((api) => api.submitReport(input)),
};

export * from './types';
export { ApiError, isApiError } from './errors';
export { queryKeys } from './queryKeys';
