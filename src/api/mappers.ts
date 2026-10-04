import { ParkingDtoSchema } from './schemas';
import type { ParkingDto, ParkingPoint, ParkingResponse, ParkingSnapshot } from './types';

const ACTIVE = 'ACTIVE';

export function toParkingPoint(dto: ParkingDto): ParkingPoint {
  const active = dto.status.toUpperCase() === ACTIVE;
  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    lat: dto.latitude,
    lng: dto.longitude,
    capacity: dto.totalSpaces,
    free: active ? Math.min(dto.freeSpaces, dto.totalSpaces) : 0,
    accessibleSpaces: dto.accessibleSpaces,
    evChargingSpaces: dto.evChargingSpaces,
    active,
    confidence: dto.confidence,
    updatedAt: dto.lastUpdatedAt,
  };
}

export const toParkingSnapshot = (response: ParkingResponse): ParkingSnapshot => ({
  points: response.parking.map(toParkingPoint),
});

export function parseParkingItems(items: unknown[]): { snapshot: ParkingSnapshot; rejected: number } {
  const points: ParkingPoint[] = [];
  let rejected = 0;
  for (const item of items) {
    const result = ParkingDtoSchema.safeParse(item);
    if (result.success) points.push(toParkingPoint(result.data));
    else rejected++;
  }
  return { snapshot: { points }, rejected };
}
