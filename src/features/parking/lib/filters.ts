import type { ParkingPoint } from '@/api/types';
import { availableAccessible, availableEv } from './availability';

export type FilterKind = 'free' | 'ev' | 'accessible';
export type FeeFilter = 'any' | 'free' | 'paid';

export interface ParkingFilters {
  free: boolean;
  ev: boolean;
  accessible: boolean;
  fee: FeeFilter;
  types: string[];
}

export const NO_FILTERS: ParkingFilters = { free: false, ev: false, accessible: false, fee: 'any', types: [] };

export const activeFilterCount = (filters: ParkingFilters) =>
  Number(filters.free) + Number(filters.ev) + Number(filters.accessible) + Number(filters.fee !== 'any') + Number(filters.types.length > 0);

export const hasActiveFilter = (filters: ParkingFilters) => activeFilterCount(filters) > 0;

export function matchesFilters(point: ParkingPoint, filters: ParkingFilters): boolean {
  if (filters.free && !(point.active && point.free > 0)) return false;
  if (filters.ev && availableEv(point) <= 0) return false;
  if (filters.accessible && availableAccessible(point) <= 0) return false;
  if (filters.fee === 'free' && point.paid !== false) return false;
  if (filters.fee === 'paid' && point.paid !== true) return false;
  if (filters.types.length > 0 && !(point.kind && filters.types.includes(point.kind))) return false;
  return true;
}

export const applyFilters = (points: ParkingPoint[], filters: ParkingFilters) =>
  hasActiveFilter(filters) ? points.filter((p) => matchesFilters(p, filters)) : points;

export function availableTypes(points: ParkingPoint[]): string[] {
  return [...new Set(points.map((p) => p.kind).filter((k): k is string => Boolean(k)))].sort();
}
