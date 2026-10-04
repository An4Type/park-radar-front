import { parseZoneItems } from '../mappers';
import { distanceMeters, roundLatLng } from '@/shared/lib/geo';
import { safeStorage } from '@/shared/lib/safeStorage';
import type { LatLng, ParkingReport, ReportInput, ReportLevel, ZoneDto } from '../types';
import { hashString, seededRandom } from './random';

export const REPORT_TTL_MS = 30 * 60_000;
const MERGE_RADIUS_M = 30;
const STORAGE_KEY = 'park-radar.zones';
const METERS_PER_DEG = 111_320;
const LEVELS: ReportLevel[] = ['none', 'few', 'many'];

type WireZone = Omit<ZoneDto, 'level'> & { level: string };

export interface ReportStore {
  list(near: LatLng, now: number): ParkingReport[];
  add(input: ReportInput, now: number): ParkingReport;
}

function seedZones(near: LatLng, now: number): WireZone[] {
  const anchor = roundLatLng(near, 2);
  const slot = Math.floor(now / (10 * 60_000));
  return Array.from({ length: 5 }, (_, i) => {
    const rnd = seededRandom(hashString(`${anchor.lat},${anchor.lng}:${i}`));
    const east = (rnd() - 0.5) * 1600;
    const north = (rnd() - 0.5) * 1600;
    const minutesAgo = 2 + Math.floor(seededRandom(hashString(`${i}:${slot}`))() * 25);
    const createdAt = now - minutesAgo * 60_000;
    return {
      id: `seed-${anchor.lat}-${anchor.lng}-${i}`,
      latitude: anchor.lat + north / METERS_PER_DEG,
      longitude: anchor.lng + east / (METERS_PER_DEG * Math.cos((anchor.lat * Math.PI) / 180)),
      level: LEVELS[Math.floor(rnd() * LEVELS.length)].toUpperCase(),
      createdAt: new Date(createdAt).toISOString(),
      expiresAt: new Date(createdAt + REPORT_TTL_MS).toISOString(),
    };
  });
}

export function createReportStore({ seed }: { seed: boolean }): ReportStore {
  const storage = safeStorage();

  const load = (): WireZone[] => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(String(raw)) as WireZone[]) : [];
    } catch {
      return [];
    }
  };
  const save = (zones: WireZone[]) => {
    try {
      void storage.setItem(STORAGE_KEY, JSON.stringify(zones));
    } catch {
      return;
    }
  };
  const fresh = (now: number) => load().filter((z) => !z.expiresAt || Date.parse(z.expiresAt) > now);

  return {
    list(near, now) {
      return parseZoneItems([...(seed ? seedZones(near, now) : []), ...fresh(now)], now).reports;
    },

    add({ location, level }, now) {
      const own = fresh(now).filter((z) => distanceMeters({ lat: z.latitude, lng: z.longitude }, location) > MERGE_RADIUS_M);
      const zone: WireZone = {
        id: `zone-${now.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
        latitude: location.lat,
        longitude: location.lng,
        level: level.toUpperCase(),
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + REPORT_TTL_MS).toISOString(),
      };
      save([...own, zone]);
      return parseZoneItems([zone], now).reports[0];
    },
  };
}
