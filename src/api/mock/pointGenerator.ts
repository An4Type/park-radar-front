import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';
import type { LatLng, ParkingDto } from '../types';
import { hashString, seededRandom } from './random';

const SITE_RESOLUTION = 10;
const CITY_RINGS = 18;
const SITE_DENSITY = 0.12;
const JITTER_DEG = 0.0005;

export const TICK_MS = 5_000;
const DRIFT_PERIOD_MS = 7 * 60_000;

interface Site {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  baseline: number;
  phase: number;
  active: boolean;
  confidence: number;
}

const KNOWN_SITES: ReadonlyArray<Omit<Site, 'baseline' | 'phase' | 'active' | 'confidence'>> = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Stary Browar', address: 'Półwiejska 42, Poznań', latitude: 52.4009, longitude: 16.9281, totalSpaces: 320 },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Posnania', address: 'Pleszewska 1, Poznań', latitude: 52.397, longitude: 16.9542, totalSpaces: 500 },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Avenida Poznań', address: 'Matyi 2, Poznań', latitude: 52.4004, longitude: 16.9128, totalSpaces: 230 },
  { id: '00000000-0000-4000-8000-000000000004', name: 'Galeria Malta', address: 'Maltańska 1, Poznań', latitude: 52.4082, longitude: 16.9616, totalSpaces: 180 },
  { id: '00000000-0000-4000-8000-000000000005', name: 'Plac Wolności', address: 'Plac Wolności 18, Poznań', latitude: 52.4091, longitude: 16.9254, totalSpaces: 95 },
];

const STREETS: readonly string[] = [
  'Święty Marcin', 'Garbary', 'Wielka', 'Ratajczaka', 'Głogowska', 'Dąbrowskiego', 'Grunwaldzka',
  'Królowej Jadwigi', 'Strzelecka', 'Mostowa', 'Kościuszki', 'Fredry', 'Wierzbięcice', 'Towarowa',
];

const TAURON_ARENA: LatLng = { lat: 50.0677, lng: 19.9916 };

const ARENA_SITES: ReadonlyArray<Omit<Site, 'baseline' | 'phase' | 'active' | 'confidence'>> = [
  { id: 'tauron-arena-p1', name: 'Tauron Arena P1', address: 'Stanisława Lema 7, Kraków', latitude: 50.0684, longitude: 19.9893, totalSpaces: 600 },
  { id: 'tauron-arena-p2', name: 'Tauron Arena P2', address: 'Stanisława Lema 7, Kraków', latitude: 50.0665, longitude: 19.9938, totalSpaces: 450 },
  { id: 'tauron-arena-p3', name: 'Tauron Arena P3', address: 'Ofiar Dąbia, Kraków', latitude: 50.0662, longitude: 19.9886, totalSpaces: 280 },
];

const ARENA_STREETS: readonly string[] = [
  'Stanisława Lema', 'Ofiar Dąbia', 'Aleja Pokoju', 'Fabryczna', 'Mogilska', 'Żabiego Kruka',
  'Bajeczna', 'Cystersów', 'Rondo Grzegórzeckie', 'Dąbska', 'Lublańska', 'Meissnera',
];

const ARENA_RINGS = 6;
const ARENA_DENSITY = 0.45;

const KINDS = [
  { label: 'Parking', spaces: [12, 40] },
  { label: 'Parking', spaces: [40, 150] },
  { label: 'Garaż', spaces: [150, 450] },
] as const;

const cityCache = new Map<string, Site[]>();

function siteDefaults(seed: number) {
  const rnd = seededRandom(seed ^ 0x9e3779b9);
  return { baseline: rnd(), phase: rnd() * Math.PI * 2, active: rnd() > 0.03, confidence: 0.7 + rnd() * 0.28 };
}

function generateArea(
  center: string,
  rings: number,
  density: number,
  streets: readonly string[],
  seen: Set<string>,
): Site[] {
  const sites: Site[] = [];
  for (const cell of gridDisk(center, rings)) {
    if (seen.has(cell)) continue;
    seen.add(cell);
    const seed = hashString(cell);
    if ((seed % 1000) / 1000 >= density) continue;

    const rnd = seededRandom(seed);
    const [lat, lng] = cellToLatLng(cell);
    const count = 1 + Math.floor(rnd() * 3);

    for (let i = 0; i < count; i++) {
      const roll = rnd();
      const kind = KINDS[roll < 0.55 ? 0 : roll < 0.88 ? 1 : 2];
      const street = streets[Math.floor(rnd() * streets.length)];
      const id = `mock-${cell}-${i}`;
      sites.push({
        id,
        name: `${kind.label} ${street}`,
        address: `${street} ${1 + Math.floor(rnd() * 120)}`,
        latitude: lat + (rnd() - 0.5) * 2 * JITTER_DEG,
        longitude: lng + (rnd() - 0.5) * 2 * JITTER_DEG * 1.6,
        totalSpaces: kind.spaces[0] + Math.floor(rnd() * (kind.spaces[1] - kind.spaces[0])),
        ...siteDefaults(hashString(id)),
      });
    }
  }
  return sites;
}

function citySites(anchor: LatLng): Site[] {
  const origin = latLngToCell(anchor.lat, anchor.lng, SITE_RESOLUTION);
  const cached = cityCache.get(origin);
  if (cached) return cached;

  const sites: Site[] = [...KNOWN_SITES, ...ARENA_SITES].map((site) => ({
    ...site,
    ...siteDefaults(hashString(site.id)),
    active: true,
  }));

  const seen = new Set<string>();
  const arenaCell = latLngToCell(TAURON_ARENA.lat, TAURON_ARENA.lng, SITE_RESOLUTION);
  sites.push(...generateArea(arenaCell, ARENA_RINGS, ARENA_DENSITY, ARENA_STREETS, seen));
  sites.push(...generateArea(origin, CITY_RINGS, SITE_DENSITY, STREETS, seen));

  cityCache.set(origin, sites);
  return sites;
}

function specialSpaces(site: Site) {
  const rnd = seededRandom(hashString(`${site.id}:special`));
  const accessible = site.totalSpaces < 8 ? 0 : Math.max(1, Math.round(site.totalSpaces * (0.02 + rnd() * 0.03)));
  const evChance = site.totalSpaces >= 40 ? 0.65 : 0.15;
  const ev = rnd() < evChance ? 1 + Math.floor(rnd() * Math.min(16, 2 + site.totalSpaces * 0.04)) : 0;
  return { accessibleSpaces: accessible, evChargingSpaces: ev };
}

function freeAt(site: Site, now: number): number {
  const tick = Math.floor(now / TICK_MS);
  const drift = 0.15 * Math.sin((now / DRIFT_PERIOD_MS) * Math.PI * 2 + site.phase);
  const noise = (seededRandom((hashString(site.id) ^ tick) >>> 0)() - 0.5) * 0.06;
  const ratio = Math.min(0.95, Math.max(0, 0.02 + 0.6 * site.baseline + drift + noise));
  return Math.round(site.totalSpaces * ratio);
}

export function parkingDtos(anchor: LatLng, now = Date.now()): ParkingDto[] {
  return citySites(anchor).map((site) => {
    const freeSpaces = freeAt(site, now);
    const updatedSecondsAgo = seededRandom(hashString(site.id) ^ Math.floor(now / TICK_MS))() * 20;
    return {
      id: site.id,
      name: site.name,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      totalSpaces: site.totalSpaces,
      occupiedSpaces: site.totalSpaces - freeSpaces,
      freeSpaces,
      ...specialSpaces(site),
      status: site.active ? 'ACTIVE' : 'INACTIVE',
      confidence: Math.round(site.confidence * 100) / 100,
      lastUpdatedAt: new Date(now - updatedSecondsAgo * 1000).toISOString(),
    };
  });
}
