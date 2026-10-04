import type { DestinationsQuery, ReportsQuery, RouteQuery, SnapshotQuery } from './types';

export const queryKeys = {
  snapshot: (params: SnapshotQuery) => ['parking', 'snapshot', params] as const,
  destinations: (params: DestinationsQuery) => ['destinations', params] as const,
  route: (params: RouteQuery) => ['route', params] as const,
  reports: (params: ReportsQuery) => ['reports', params] as const,
  allReports: ['reports'] as const,
};
