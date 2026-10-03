import type { LatLng, ParkingPoint } from '@/api/types';
import { distanceMeters } from '@/shared/lib/geo';
import { pointLevel } from './availability';

const AVG_CITY_SPEED_MPS = 25 / 3.6;
const DETOUR_FACTOR = 1.3;
const NEARBY_M = 1_500;
const WALKABLE_M = 600;

const RANK = { many: 0, some: 1, few: 2, full: 3 } as const;

export const estimateDriveSeconds = (from: LatLng, to: LatLng) =>
  (distanceMeters(from, to) * DETOUR_FACTOR) / AVG_CITY_SPEED_MPS;

function best(points: ParkingPoint[], origin: LatLng, withinMeters: number): ParkingPoint | undefined {
  const ranked = points
    .filter((p) => p.free > 0)
    .map((point) => ({ point, rank: RANK[pointLevel(point)], distance: distanceMeters(origin, point) }));
  const near = ranked.filter((r) => r.distance <= withinMeters);
  if (near.length === 0) return ranked.sort((a, b) => a.distance - b.distance)[0]?.point;
  return near.sort((a, b) => a.rank - b.rank || a.distance - b.distance)[0].point;
}

export const recommendParking = (points: ParkingPoint[], origin: LatLng) => best(points, origin, NEARBY_M);

export const parkingForDestination = (points: ParkingPoint[], destination: LatLng) =>
  best(points, destination, WALKABLE_M);
