import { distanceMeters } from '@/shared/lib/geo';
import { ParkingResponseSchema, RouteSchema } from '../schemas';
import { createMockParkingApi } from './mockParkingApi';
import { parkingDtos, TICK_MS } from './pointGenerator';

const poznan = { lat: 52.4083, lng: 16.9335 };
const t0 = Date.UTC(2026, 9, 3, 12, 0, 0);

describe('mock parking API', () => {
  it('emits exactly the backend wire format', () => {
    const dtos = parkingDtos(poznan, t0);
    expect(() => ParkingResponseSchema.parse({ parking: dtos })).not.toThrow();
    expect(dtos.length).toBeGreaterThan(50);
    dtos.forEach((d) => {
      expect(d.freeRegularSpaces).toBeLessThanOrEqual(d.regularSpaces!);
      expect(d.freeDisabledSpaces).toBeLessThanOrEqual(d.disabledSpaces!);
      expect(d.freeEvChargerSpaces).toBeLessThanOrEqual(d.evChargerSpaces!);
    });
  });

  it('includes the real Poznań facilities', () => {
    const names = parkingDtos(poznan, t0).map((d) => d.name);
    expect(names).toEqual(expect.arrayContaining(['Stary Browar', 'Posnania', 'Galeria Malta']));
  });

  it('keeps facilities fixed but changes availability every 5 s tick', () => {
    const a = parkingDtos(poznan, t0);
    const b = parkingDtos(poznan, t0 + TICK_MS);
    expect(b.map((d) => d.id)).toEqual(a.map((d) => d.id));
    expect(b.map((d) => d.latitude)).toEqual(a.map((d) => d.latitude));
    expect(b.some((d, i) => d.freeRegularSpaces !== a[i].freeRegularSpaces)).toBe(true);
  });

  it('returns mapped points through the same path as the HTTP client', async () => {
    const api = createMockParkingApi({ latency: [0, 0], now: () => t0 });
    const { points } = await api.getSnapshot({ near: poznan });
    const browar = points.find((p) => p.name === 'Stary Browar')!;
    expect(browar).toMatchObject({ lat: 52.4009, lng: 16.9281, capacity: 320, active: true });
  });

  it('builds a route that ends at the destination', async () => {
    const api = createMockParkingApi({ latency: [0, 0], routers: [] });
    const to = { lat: 52.4009, lng: 16.9281 };
    const route = RouteSchema.parse(await api.getRoute({ from: poznan, to }));
    expect(route.geometry.at(-1)).toEqual(to);
    expect(route.steps.at(-1)?.maneuver).toBe('arrive');
  });

  it('honours abort signals', async () => {
    const slow = createMockParkingApi({ latency: [50, 50] });
    const controller = new AbortController();
    const pending = slow.getSnapshot({ near: poznan }, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'aborted' });
  });
});

describe('Tauron Arena mock area', () => {
  const arena = { lat: 50.0677, lng: 19.9916 };

  it('always includes the arena lots and dense parking around the arena', () => {
    const dtos = parkingDtos(poznan, t0);
    expect(dtos.map((d) => d.name)).toEqual(expect.arrayContaining(['Tauron Arena P1', 'Tauron Arena P2']));
    const nearArena = dtos.filter((d) => distanceMeters(arena, { lat: d.latitude, lng: d.longitude }) < 800);
    expect(nearArena.length).toBeGreaterThan(20);
  });

  it('finds the arena in search', async () => {
    const api = createMockParkingApi({ latency: [0, 0] });
    const [hit] = await api.searchDestinations({ query: 'tauron', near: poznan });
    expect(hit).toMatchObject({ name: 'Tauron Arena Kraków', location: arena });
  });
});

describe('mock routing fallback', () => {
  const from = { lat: 51.1079, lng: 17.0385 };
  const to = { lat: 51.1079, lng: 17.0276 };
  const hang = (_f: unknown, _t: unknown, signal?: AbortSignal) =>
    new Promise<never>((_, reject) => signal?.addEventListener('abort', () => reject(new Error('aborted'))));

  it('moves on when a router hangs, and still returns a route', async () => {
    const api = createMockParkingApi({ latency: [0, 0], routers: [hang, hang], routerTimeoutMs: 20 });
    const route = await api.getRoute({ from, to });
    expect(route.geometry.at(-1)).toEqual(to);
  });

  it('uses the first router that answers', async () => {
    const fake = { distanceMeters: 1, durationSeconds: 1, geometry: [from, to], steps: [{ maneuver: 'arrive' as const, instruction: 'x', location: to, distanceMeters: 1 }] };
    const api = createMockParkingApi({ latency: [0, 0], routers: [hang, async () => fake], routerTimeoutMs: 20 });
    expect(await api.getRoute({ from, to })).toBe(fake);
  });
});
