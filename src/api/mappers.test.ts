import { parseParkingItems, toParkingPoint } from './mappers';
import { ParkingDtoSchema } from './schemas';

const dto = ParkingDtoSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Stary Browar',
  address: 'Półwiejska 42, Poznań',
  latitude: 52.4009,
  longitude: 16.9281,
  totalSpaces: 320,
  occupiedSpaces: 173,
  freeSpaces: 147,
  status: 'ACTIVE',
  confidence: 0.92,
  lastUpdatedAt: '2026-10-03T15:50:05.630Z',
});

describe('toParkingPoint', () => {
  it('maps the backend sample', () => {
    expect(toParkingPoint(dto)).toEqual({
      id: dto.id,
      name: 'Stary Browar',
      address: 'Półwiejska 42, Poznań',
      lat: 52.4009,
      lng: 16.9281,
      capacity: 320,
      free: 147,
      accessibleSpaces: 0,
      freeAccessible: null,
      evChargingSpaces: 0,
      freeEv: null,
      paid: null,
      kind: null,
      active: true,
      confidence: 0.92,
      updatedAt: '2026-10-03T15:50:05.630Z',
    });
  });

  it('treats non-active facilities as having no free spaces', () => {
    expect(toParkingPoint({ ...dto, status: 'INACTIVE' })).toMatchObject({ free: 0, active: false });
  });

  it('never reports more free spaces than exist', () => {
    expect(toParkingPoint({ ...dto, freeSpaces: 999 }).free).toBe(320);
  });
});

describe('production payload', () => {
  const base = {
    id: 'x', name: 'Galeria Krakowska', address: 'Pawia 5, Kraków', latitude: 50.0676, longitude: 19.945,
    totalSpaces: 320, occupiedSpaces: 170, freeSpaces: 150, status: 'ACTIVE',
  };

  it('accepts null confidence and lastUpdatedAt', () => {
    const { snapshot, rejected } = parseParkingItems([{ ...base, confidence: null, lastUpdatedAt: null }]);
    expect(rejected).toBe(0);
    expect(snapshot.points[0]).toMatchObject({ confidence: null, updatedAt: null, free: 150, accessibleSpaces: 0 });
  });

  it('skips only the invalid facilities', () => {
    const { snapshot, rejected } = parseParkingItems([
      { ...base, confidence: 0.78, lastUpdatedAt: '2026-10-03T23:55:10.639Z' },
      { ...base, id: 'broken', latitude: 'nope' },
    ]);
    expect(snapshot.points.map((p) => p.id)).toEqual(['x']);
    expect(rejected).toBe(1);
  });
});

describe('extended parking fields', () => {
  const dto = {
    id: 'p1', name: 'Bonarka', address: 'Kamieńskiego 11', latitude: 50.03, longitude: 19.95,
    totalSpaces: 500, disabledSpaces: 12, evChargerSpaces: 6, isPaid: true, type: 'OUTDOOR',
    occupiedSpaces: 290, freeSpaces: 210, status: 'ACTIVE', confidence: 0.9, lastUpdatedAt: '2026-10-04T03:24:52.089Z',
  };

  it('maps disabled/EV spaces, fee and type', () => {
    expect(parseParkingItems([dto]).snapshot.points[0]).toMatchObject({
      accessibleSpaces: 12, evChargingSpaces: 6, paid: true, kind: 'OUTDOOR',
    });
  });

  it('still accepts the older field names and missing extras', () => {
    const newer = new Set(['disabledSpaces', 'evChargerSpaces', 'isPaid', 'type']);
    const older = Object.fromEntries(Object.entries(dto).filter(([key]) => !newer.has(key)));
    const point = parseParkingItems([{ ...older, accessibleSpaces: 3, evChargingSpaces: 1 }]).snapshot.points[0];
    expect(point).toMatchObject({ accessibleSpaces: 3, evChargingSpaces: 1, paid: null, kind: null });
  });
});

describe('per-type space counts (current backend schema)', () => {
  const live = {
    id: '00000000-0000-4000-8000-000000000006', name: 'AGH street parking',
    address: 'Główna Aleja Kampusu AGH, al. Mickiewicza 30, Kraków', latitude: 50.0639, longitude: 19.9241,
    isPaid: false, type: 'OUTDOOR',
    regularSpaces: 40, freeRegularSpaces: 12, disabledSpaces: 4, freeDisabledSpaces: 1, evChargerSpaces: 6, freeEvChargerSpaces: 2,
    status: 'ACTIVE', confidence: 0.78, lastUpdatedAt: '2026-10-04T03:55:15.100Z',
  };

  it('sums the space types into capacity and free', () => {
    expect(parseParkingItems([live]).snapshot.points[0]).toMatchObject({
      capacity: 50, free: 15, accessibleSpaces: 4, freeAccessible: 1, evChargingSpaces: 6, freeEv: 2, paid: false, kind: 'OUTDOOR',
    });
  });

  it('rejects records with neither regularSpaces nor totalSpaces', () => {
    const broken: Record<string, unknown> = { ...live };
    delete broken.regularSpaces;
    expect(parseParkingItems([broken]).rejected).toBe(1);
  });
});
