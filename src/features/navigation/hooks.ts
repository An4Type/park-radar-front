import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { parkingApi, queryKeys, type LatLng, type ParkingPoint, type Route } from '@/api';
import { useFrozenPosition } from '@/features/location/hooks';
import { distanceMeters, roundLatLng } from '@/shared/lib/geo';
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

export function useActiveRoute(point: ParkingPoint | undefined) {
  const routeOrigin = useTripStore((s) => s.routeOrigin);
  const frozen = useFrozenPosition();
  const origin = routeOrigin ?? frozen;
  const to = point ? { lat: point.lat, lng: point.lng } : undefined;
  return { ...useRoute(to, origin), origin };
}

const STEP_REACHED_M = 25;
const ARRIVED_M = 35;

export interface NavigationProgress {
  stepIndex: number;
  distanceToStepMeters: number;
  remainingMeters: number;
  remainingSeconds: number;
  arrived: boolean;
}

export function useNavigationProgress(route: Route | undefined, position: LatLng): NavigationProgress | null {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => setStepIndex(0), [route]);

  useEffect(() => {
    if (!route) return;
    const step = route.steps[stepIndex];
    const isLast = stepIndex === route.steps.length - 1;
    if (!isLast && step && distanceMeters(position, step.location) < STEP_REACHED_M) {
      setStepIndex(stepIndex + 1);
    }
  }, [route, position, stepIndex]);

  return useMemo(() => {
    if (!route) return null;
    const index = Math.min(stepIndex, route.steps.length - 1);
    const step = route.steps[index];
    const distanceToStep = distanceMeters(position, step.location);
    const after = route.steps.slice(index + 1).reduce((sum, s) => sum + s.distanceMeters, 0);
    const remaining = distanceToStep + after;
    const ratio = route.distanceMeters > 0 ? Math.min(1, remaining / route.distanceMeters) : 0;
    return {
      stepIndex: index,
      distanceToStepMeters: distanceToStep,
      remainingMeters: remaining,
      remainingSeconds: route.durationSeconds * ratio,
      arrived: index === route.steps.length - 1 && distanceToStep < ARRIVED_M,
    };
  }, [route, stepIndex, position]);
}
