import { parseZoneItems } from './mappers';
import { createMockParkingApi } from './mock/mockParkingApi';
import { REPORT_TTL_MS } from './mock/reportStore';

const now = Date.parse('2026-10-04T03:20:00.000Z');

describe('zones payload', () => {
  const zone = {
    id: '34a33b30-616d-4949-a842-bc9c53675476',
    latitude: 50.0639,
    longitude: 19.9241,
    level: 'FEW',
    createdAt: '2026-10-04T03:17:21.309Z',
    expiresAt: '2026-10-04T03:47:21.294Z',
  };

  it('maps the backend sample, normalising the level', () => {
    const { reports, rejected } = parseZoneItems([zone], now);
    expect(rejected).toBe(0);
    expect(reports[0]).toEqual({
      id: zone.id,
      lat: 50.0639,
      lng: 19.9241,
      level: 'few',
      createdAt: zone.createdAt,
      expiresAt: zone.expiresAt,
    });
  });

  it('accepts zones without createdAt (current backend data)', () => {
    const { reports, rejected } = parseZoneItems(
      [{ id: '00000000-0000-4000-8000-000000000263', latitude: 50.0645, longitude: 19.95647, level: 'NONE', expiresAt: null }],
      now,
    );
    expect(rejected).toBe(0);
    expect(reports[0]).toMatchObject({ level: 'none', createdAt: null, expiresAt: null });
  });

  it('accepts lowercase levels and a missing expiry', () => {
    const { reports } = parseZoneItems([{ ...zone, level: 'many', expiresAt: null }], now);
    expect(reports[0]).toMatchObject({ level: 'many', expiresAt: null });
  });

  it('drops expired zones and invalid records', () => {
    const { reports, rejected } = parseZoneItems(
      [
        { ...zone, id: 'expired', expiresAt: '2026-10-04T03:00:00.000Z' },
        { ...zone, id: 'bad', level: 'LOTS' },
        { ...zone, id: 'ok' },
      ],
      now,
    );
    expect(reports.map((r) => r.id)).toEqual(['ok']);
    expect(rejected).toBe(1);
  });
});

describe('mock zone reports', () => {

  it('stores a report and returns it until it expires', async () => {
    let clock = now;
    const api = createMockParkingApi({ latency: [0, 0], now: () => clock, seedReports: false });
    const created = await api.submitReport({ location: { lat: 50.0639, lng: 19.9241 }, level: 'none' });
    expect(created).toMatchObject({ level: 'none', lat: 50.0639 });
    expect((await api.getReports({ near: { lat: 50.06, lng: 19.92 } })).map((r) => r.id)).toEqual([created.id]);
    clock += REPORT_TTL_MS + 1;
    expect(await api.getReports({ near: { lat: 50.06, lng: 19.92 } })).toEqual([]);
  });

  it('replaces your earlier report at the same spot', async () => {
    const api = createMockParkingApi({ latency: [0, 0], now: () => now, seedReports: false });
    await api.submitReport({ location: { lat: 50.0639, lng: 19.9241 }, level: 'none' });
    await api.submitReport({ location: { lat: 50.06391, lng: 19.92411 }, level: 'many' });
    const reports = await api.getReports({ near: { lat: 50.06, lng: 19.92 } });
    expect(reports.map((r) => r.level)).toEqual(['many']);
  });
});
