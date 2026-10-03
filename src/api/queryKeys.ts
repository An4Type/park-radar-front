import type { DestinationsQuery, RouteQuery, SnapshotQuery } from './types';

export const queryKeys = {
  snapshot: (params: SnapshotQuery) => ['parking', 'snapshot', params] as const,
  destinations: (params: DestinationsQuery) => ['destinations', params] as const,
  route: (params: RouteQuery) => ['route', params] as const,
};
