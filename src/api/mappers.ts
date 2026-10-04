import { ParkingDtoSchema, ZoneDtoSchema } from './schemas';
import type { ParkingDto, ParkingPoint, ParkingReport, ParkingResponse, ParkingSnapshot, ZoneDto } from './types';

const ACTIVE = 'ACTIVE';

export function toParkingPoint(dto: ParkingDto): ParkingPoint {
  const active = dto.status.toUpperCase() === ACTIVE;
  const accessible = dto.disabledSpaces ?? dto.accessibleSpaces ?? 0;
  const ev = dto.evChargerSpaces ?? dto.evChargingSpaces ?? 0;
  const byType = dto.regularSpaces != null;

  const capacity = byType ? (dto.regularSpaces ?? 0) + accessible + ev : (dto.totalSpaces ?? 0);
  const freeTotal = byType
    ? (dto.freeRegularSpaces ?? 0) + (dto.freeDisabledSpaces ?? 0) + (dto.freeEvChargerSpaces ?? 0)
    : (dto.freeSpaces ?? 0);
  const clamp = (value: number | null | undefined, max: number) =>
    value == null ? null : active ? Math.min(value, max) : 0;

  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    lat: dto.latitude,
    lng: dto.longitude,
    capacity,
    free: active ? Math.min(freeTotal, capacity) : 0,
    accessibleSpaces: accessible,
    freeAccessible: clamp(dto.freeDisabledSpaces, accessible),
    evChargingSpaces: ev,
    freeEv: clamp(dto.freeEvChargerSpaces, ev),
    paid: dto.isPaid,
    kind: dto.type,
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

export const toParkingReport = (dto: ZoneDto): ParkingReport => ({
  id: dto.id,
  lat: dto.latitude,
  lng: dto.longitude,
  level: dto.level,
  createdAt: dto.createdAt,
  expiresAt: dto.expiresAt,
});

export const isActiveReport = (report: ParkingReport, now = Date.now()) =>
  !report.expiresAt || Date.parse(report.expiresAt) > now;

export function parseZoneItems(items: unknown[], now = Date.now()): { reports: ParkingReport[]; rejected: number } {
  const reports: ParkingReport[] = [];
  let rejected = 0;
  for (const item of items) {
    const result = ZoneDtoSchema.safeParse(item);
    if (!result.success) rejected++;
    else {
      const report = toParkingReport(result.data);
      if (isActiveReport(report, now)) reports.push(report);
    }
  }
  return { reports, rejected };
}
