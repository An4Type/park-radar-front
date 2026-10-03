import { union, type Geom } from 'polyclip-ts';
import type { LatLng, ParkingPoint } from '@/api/types';
import { distanceMeters } from '@/shared/lib/geo';
import type { HexShape, ParkingGeometry, Ring } from '../model';

export const HEX_RADIUS_M = 26;

const M_PER_DEG = 111_320;

export function hexAround({ lat, lng }: LatLng, radiusMeters = HEX_RADIUS_M): Ring {
  const dLat = radiusMeters / M_PER_DEG;
  const dLng = radiusMeters / (M_PER_DEG * Math.cos((lat * Math.PI) / 180));
  const ring: Ring = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    ring.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  ring.push(ring[0]);
  return ring;
}

export function buildGeometry(points: ReadonlyArray<Pick<ParkingPoint, 'id' | 'lat' | 'lng'>>): ParkingGeometry {
  const hexes: HexShape[] = points.map((point) => ({ id: point.id, ring: hexAround(point) }));
  if (hexes.length === 0) return { hexes, outline: [] };
  const [first, ...rest] = hexes.map((hex) => [hex.ring] as Geom);
  return { hexes, outline: union(first, ...rest) };
}

export interface ParkingIndex {
  points: ParkingPoint[];
  byId: Map<string, ParkingPoint>;
  geometry: ParkingGeometry;
}

let lastGeometry: { key: string; geometry: ParkingGeometry } | null = null;
const indexCache = new WeakMap<ParkingPoint[], ParkingIndex>();

const positionKey = (points: ParkingPoint[]) =>
  points
    .map((p) => `${p.id}:${p.lat.toFixed(6)}:${p.lng.toFixed(6)}`)
    .sort()
    .join('|');

export function indexParking(points: ParkingPoint[]): ParkingIndex {
  const cached = indexCache.get(points);
  if (cached) return cached;

  const key = positionKey(points);
  if (lastGeometry?.key !== key) lastGeometry = { key, geometry: buildGeometry(points) };

  const index = { points, byId: new Map(points.map((p) => [p.id, p])), geometry: lastGeometry.geometry };
  indexCache.set(points, index);
  return index;
}

export function nearestOf(candidates: ParkingPoint[], at: LatLng): ParkingPoint | undefined {
  return candidates.reduce<ParkingPoint | undefined>(
    (best, p) => (!best || distanceMeters(at, p) < distanceMeters(at, best) ? p : best),
    undefined,
  );
}

export const hexPoints = (point: LatLng): LatLng[] => hexAround(point).map(([lng, lat]) => ({ lat, lng }));
