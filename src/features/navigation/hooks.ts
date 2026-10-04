import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parkingApi, queryKeys, type LatLng, type Route } from '@/api';
import { useFrozenPosition } from '@/features/location/hooks';
import { roundLatLng } from '@/shared/lib/geo';
import {
  OFF_ROUTE_M,
  prepareRoute,
  progressAt,
  remainingLine,
  snapToRoute,
  type PreparedRoute,
  type RouteProgress,
  type RouteSnap,
} from './lib/routeMatcher';
import { useTripStore } from './tripStore';

const NOWHERE: LatLng = { lat: 0, lng: 0 };

export function useRoute(to: LatLng | undefined, from: LatLng) {
  const params = { from: roundLatLng(from, 4), to: roundLatLng(to ?? NOWHERE, 5) };
  return useQuery({
    queryKey: queryKeys.route(params),
    queryFn: ({ signal }) => parkingApi.getRoute(params, signal),
    enabled: Boolean(to),
    staleTime: 5 * 60_000,
  });
}

export function useActiveRoute(point: LatLng | undefined) {
  const routeOrigin = useTripStore((s) => s.routeOrigin);
  const frozen = useFrozenPosition();
  const origin = routeOrigin ?? frozen;
  const to = point ? { lat: point.lat, lng: point.lng } : undefined;
  return { ...useRoute(to, origin), origin };
}

export interface RouteGuidance extends RouteProgress {
  prepared: PreparedRoute;
  snapped: RouteSnap;
  onRoute: boolean;
  remainingGeometry: LatLng[];
}

export function useRouteGuidance(route: Route | undefined, position: LatLng): RouteGuidance | null {
  const prepared = useMemo(() => (route ? prepareRoute(route) : null), [route]);
  const [guidance, setGuidance] = useState<RouteGuidance | null>(null);
  const hint = useRef<number | undefined>(undefined);
  const minStep = useRef(0);

  useEffect(() => {
    hint.current = undefined;
    minStep.current = 0;
    setGuidance(null);
  }, [prepared]);

  useEffect(() => {
    if (!prepared) return;
    const snapped = snapToRoute(prepared, position, hint.current);
    const onRoute = snapped.offsetMeters <= OFF_ROUTE_M;
    if (onRoute) hint.current = snapped.segment;
    const progress = progressAt(prepared, snapped.along, minStep.current);
    if (onRoute) minStep.current = progress.stepIndex;
    setGuidance({ ...progress, prepared, snapped, onRoute, remainingGeometry: remainingLine(prepared, snapped) });
  }, [prepared, position]);

  return guidance;
}
