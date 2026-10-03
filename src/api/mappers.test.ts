import { toParkingPoint } from './mappers';
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
