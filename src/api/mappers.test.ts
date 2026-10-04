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
      evChargingSpaces: 0,
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
