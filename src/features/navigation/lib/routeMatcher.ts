import type { LatLng, Route } from '@/api/types';
import { bearingDegrees, distanceMeters } from '@/shared/lib/geo';

const M_PER_DEG = 111_320;
const LOCAL_WINDOW_BEHIND = 2;
const LOCAL_WINDOW_AHEAD = 60;
export const OFF_ROUTE_M = 40;
const STEP_PASSED_M = 8;
export const ARRIVED_M = 30;

export interface PreparedRoute {
  route: Route;
  points: LatLng[];
  cumulative: number[];
  stepAlong: number[];
  total: number;
}

export interface RouteSnap {
  point: LatLng;
  along: number;
  offsetMeters: number;
  segment: number;
  bearing: number;
}

export interface RouteProgress {
  stepIndex: number;
  distanceToStepMeters: number;
  remainingMeters: number;
  remainingSeconds: number;
  arrived: boolean;
}

function projectOnSegment(p: LatLng, a: LatLng, b: LatLng) {
  const kx = Math.cos((p.lat * Math.PI) / 180) * M_PER_DEG;
  const ky = M_PER_DEG;
  const ax = (a.lng - p.lng) * kx;
  const ay = (a.lat - p.lat) * ky;
  const bx = (b.lng - p.lng) * kx;
  const by = (b.lat - p.lat) * ky;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2)) : 0;
  const x = ax + t * dx;
  const y = ay + t * dy;
  return {
    t,
    distance: Math.hypot(x, y),
    point: { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) },
  };
}

function nearest(prepared: PreparedRoute, position: LatLng, from: number, to: number): RouteSnap | null {
  const { points, cumulative } = prepared;
  let best: RouteSnap | null = null;
  for (let i = Math.max(0, from); i < Math.min(points.length - 1, to); i++) {
    const { t, distance, point } = projectOnSegment(position, points[i], points[i + 1]);
    if (!best || distance < best.offsetMeters) {
      best = {
        point,
        along: cumulative[i] + t * (cumulative[i + 1] - cumulative[i]),
        offsetMeters: distance,
        segment: i,
        bearing: bearingDegrees(points[i], points[i + 1]),
      };
    }
  }
  return best;
}

export function snapToRoute(prepared: PreparedRoute, position: LatLng, hintSegment?: number): RouteSnap {
  if (hintSegment !== undefined) {
    const local = nearest(prepared, position, hintSegment - LOCAL_WINDOW_BEHIND, hintSegment + LOCAL_WINDOW_AHEAD);
    if (local && local.offsetMeters <= OFF_ROUTE_M) return local;
  }
  return nearest(prepared, position, 0, prepared.points.length)!;
}

export function prepareRoute(route: Route): PreparedRoute {
  const points = route.geometry;
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distanceMeters(points[i - 1], points[i]));
  const prepared: PreparedRoute = { route, points, cumulative, stepAlong: [], total: cumulative[cumulative.length - 1] };

  let hint = 0;
  prepared.stepAlong = route.steps.map((step) => {
    const snap = snapToRoute(prepared, step.location, hint);
    hint = snap.segment;
    return snap.along;
  });
  return prepared;
}

export function progressAt(prepared: PreparedRoute, along: number, minStep = 0): RouteProgress {
  const { stepAlong, total, route } = prepared;
  const last = stepAlong.length - 1;
  let stepIndex = last;
  for (let i = minStep; i <= last; i++) {
    if (stepAlong[i] > along + STEP_PASSED_M) {
      stepIndex = i;
      break;
    }
  }
  const remainingMeters = Math.max(0, total - along);
  return {
    stepIndex,
    distanceToStepMeters: Math.max(0, stepAlong[stepIndex] - along),
    remainingMeters,
    remainingSeconds: total > 0 ? route.durationSeconds * (remainingMeters / total) : 0,
    arrived: remainingMeters <= ARRIVED_M,
  };
}

export function remainingLine(prepared: PreparedRoute, snap: RouteSnap): LatLng[] {
  return [snap.point, ...prepared.points.slice(snap.segment + 1)];
}
