import { cellToBoundary, cellsToMultiPolygon, gridDisk, latLngToCell } from 'h3-js';
import type { LatLng, ParkingPoint } from '@/api/types';
import { distanceMeters } from '@/shared/lib/geo';
import type { CellShape, ClusterOutline, ParkingGeometry } from '../model';

export const CELL_RESOLUTION = 11;

export const cellOf = (point: LatLng) => latLngToCell(point.lat, point.lng, CELL_RESOLUTION);

export function buildGeometry(cellIds: Iterable<string>): ParkingGeometry {
  const sorted = [...new Set(cellIds)].sort();
  const cells: CellShape[] = sorted.map((id) => ({ id, ring: cellToBoundary(id, true) }));

  const remaining = new Set(sorted);
  const clusters: ClusterOutline[] = [];
  for (const start of sorted) {
    if (!remaining.delete(start)) continue;
    const group = [start];
    for (let i = 0; i < group.length; i++) {
      for (const neighbour of gridDisk(group[i], 1)) {
        if (remaining.delete(neighbour)) group.push(neighbour);
      }
    }
    clusters.push({ id: group[0], polygon: cellsToMultiPolygon(group, true) });
  }

  return { cells, clusters };
}

export interface ParkingIndex {
  points: ParkingPoint[];
  byId: Map<string, ParkingPoint>;
  byCell: Map<string, ParkingPoint[]>;
  geometry: ParkingGeometry;
}

let lastGeometry: { key: string; geometry: ParkingGeometry } | null = null;
const indexCache = new WeakMap<ParkingPoint[], ParkingIndex>();

export function indexParking(points: ParkingPoint[]): ParkingIndex {
  const cached = indexCache.get(points);
  if (cached) return cached;

  const byId = new Map<string, ParkingPoint>();
  const byCell = new Map<string, ParkingPoint[]>();
  for (const point of points) {
    byId.set(point.id, point);
    const cell = cellOf(point);
    const bucket = byCell.get(cell);
    if (bucket) bucket.push(point);
    else byCell.set(cell, [point]);
  }

  const key = [...byCell.keys()].sort().join(',');
  if (lastGeometry?.key !== key) lastGeometry = { key, geometry: buildGeometry(byCell.keys()) };

  const index = { points, byId, byCell, geometry: lastGeometry.geometry };
  indexCache.set(points, index);
  return index;
}

export function pickInCell(index: ParkingIndex, cell: string, at: LatLng): ParkingPoint | undefined {
  const candidates = index.byCell.get(cell) ?? [];
  return candidates.reduce<ParkingPoint | undefined>(
    (best, p) => (!best || distanceMeters(at, p) < distanceMeters(at, best) ? p : best),
    undefined,
  );
}

export function cellTotals(points: ParkingPoint[]) {
  return points.reduce((t, p) => ({ free: t.free + p.free, capacity: t.capacity + p.capacity }), { free: 0, capacity: 0 });
}
