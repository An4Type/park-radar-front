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
