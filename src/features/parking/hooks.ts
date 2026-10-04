import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parkingApi, queryKeys } from '@/api';
import { useUserPosition } from '@/features/location/hooks';
import { roundLatLng } from '@/shared/lib/geo';
import { useMapStore } from '@/features/map/mapStore';
import { applyFilters, hasActiveFilter } from './lib/filters';
import { indexParking, type ParkingIndex } from './lib/hexIndex';

export const LIVE_REFRESH_MS = 5_000;

const EMPTY_INDEX: ParkingIndex = {
  points: [],
  byId: new Map(),
  geometry: { hexes: [], outline: [] },
};

export function useParkingSnapshot() {
  const { position } = useUserPosition();
  const params = { near: roundLatLng(position, 1) };

  return useQuery({
    queryKey: queryKeys.snapshot(params),
    queryFn: ({ signal }) => parkingApi.getSnapshot(params, signal),
    refetchInterval: LIVE_REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: LIVE_REFRESH_MS - 1_000,
    placeholderData: keepPreviousData,
  });
}

export function useParking() {
  const snapshot = useParkingSnapshot();
  const points = snapshot.data?.points;
  const index = useMemo(() => (points ? indexParking(points) : EMPTY_INDEX), [points]);
  return { ...snapshot, ...index };
}

export function useParkingPoint(parkingId: string | undefined) {
  const { byId, isPending, isError, refetch } = useParking();
  return { point: parkingId ? byId.get(parkingId) : undefined, isPending, isError, refetch };
}

export function useVisibleParking() {
  const parking = useParking();
  const filters = useMapStore((s) => s.filters);
  const visiblePoints = useMemo(() => applyFilters(parking.points, filters), [parking.points, filters]);
  const visible = useMemo(() => indexParking(visiblePoints), [visiblePoints]);
  return { ...parking, visiblePoints, visibleGeometry: visible.geometry, filtered: hasActiveFilter(filters) };
}
