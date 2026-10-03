import type { ParkingPoint } from '@/api/types';

export type AvailabilityLevel = 'many' | 'some' | 'few' | 'full';

const THRESHOLDS = { many: 0.4, some: 0.15 } as const;

export function availabilityLevel(free: number, capacity: number): AvailabilityLevel {
  if (free <= 0 || capacity <= 0) return 'full';
  const ratio = free / capacity;
  if (ratio >= THRESHOLDS.many) return 'many';
  if (ratio >= THRESHOLDS.some) return 'some';
  return 'few';
}

export const pointLevel = (point: Pick<ParkingPoint, 'free' | 'capacity'>) => availabilityLevel(point.free, point.capacity);

export const AVAILABILITY_LABEL: Record<AvailabilityLevel, string> = {
  many: 'Many free',
  some: 'Some',
  few: 'Few',
  full: 'Full',
};

export const FILLING_UP_BELOW = 5;
