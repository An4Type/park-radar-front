import { availabilityLevel } from './availability';
import type { ParkingPoint } from '@/api/types';
import { recommendParking } from './recommend';

describe('availabilityLevel', () => {
  it.each([
    [0, 40, 'full'],
    [3, 40, 'few'],
    [6, 40, 'some'],
    [16, 40, 'many'],
    [5, 0, 'full'],
  ] as const)('%i free of %i is %s', (free, capacity, level) => {
    expect(availabilityLevel(free, capacity)).toBe(level);
  });
});

const origin = { lat: 50, lng: 20 };
const parking = (id: string, free: number, capacity: number, lat: number): ParkingPoint => ({
  id, name: id, address: '', lat, lng: 20, capacity, free, accessibleSpaces: 0, freeAccessible: null, evChargingSpaces: 0, freeEv: null, paid: null, kind: null, active: true, confidence: 1,
  updatedAt: new Date().toISOString(),
});

describe('recommendParking', () => {
  it('prefers facilities with many free spaces over closer, fuller ones', () => {
    expect(recommendParking([parking('near', 2, 40, 50.001), parking('far', 30, 40, 50.01)], origin)?.id).toBe('far');
  });

  it('picks the closest among equally good facilities', () => {
    expect(recommendParking([parking('a', 30, 40, 50.01), parking('b', 30, 40, 50.002)], origin)?.id).toBe('b');
  });

  it('ignores full facilities', () => {
    expect(recommendParking([parking('full', 0, 40, 50.001)], origin)).toBeUndefined();
  });

  it('does not send the user across town for a slightly emptier one', () => {
    const nearSome = parking('near', 8, 40, 50.002);
    const farMany = parking('far', 30, 40, 50.05);
    expect(recommendParking([nearSome, farMany], origin)?.id).toBe('near');
  });
});
