import type { ParkingPoint } from '@/api/types';
import { distanceMeters } from '@/shared/lib/geo';
import { HEX_RADIUS_M, hexAround, indexParking, nearestOf } from './hexIndex';

function point(id: string, lat: number, lng: number, free = 10): ParkingPoint {
  return {
    id, name: id, address: '', lat, lng, capacity: 50, free, accessibleSpaces: 0, freeAccessible: null, evChargingSpaces: 0, freeEv: null, paid: null, kind: null,
    active: true, confidence: 0.9, updatedAt: '2026-10-03T12:00:00Z',
  };
}

const base = { lat: 50.0677, lng: 19.9916 };
const metresEast = (m: number) => base.lng + m / (111_320 * Math.cos((base.lat * Math.PI) / 180));

describe('hexAround', () => {
  it('is centred exactly on the point', () => {
    const ring = hexAround(base);
    expect(ring).toHaveLength(7);
    for (const [lng, lat] of ring.slice(0, 6)) {
      expect(distanceMeters(base, { lat, lng })).toBeCloseTo(HEX_RADIUS_M, 0);
    }
  });
});

describe('indexParking', () => {
  it('merges overlapping hexes into one outline but keeps one hex per lot', () => {
    const { geometry } = indexParking([
      point('a', base.lat, base.lng),
      point('b', base.lat, metresEast(30)),
      point('c', base.lat, metresEast(400)),
    ]);
    expect(geometry.hexes.map((h) => h.id)).toEqual(['a', 'b', 'c']);
    expect(geometry.outline).toHaveLength(2);
  });

  it('handles lots at the very same spot', () => {
    const { geometry } = indexParking([point('a', base.lat, base.lng), point('b', base.lat, base.lng)]);
    expect(geometry.hexes).toHaveLength(2);
    expect(geometry.outline).toHaveLength(1);
  });

  it('reuses geometry when only availability changes', () => {
    const first = indexParking([point('a', base.lat, base.lng, 1)]);
    const second = indexParking([point('a', base.lat, base.lng, 7)]);
    expect(second.geometry).toBe(first.geometry);
    expect(second.byId.get('a')?.free).toBe(7);
  });
});

describe('nearestOf', () => {
  it('picks the lot nearest to the tap', () => {
    const west = point('west', base.lat, metresEast(-10));
    const east = point('east', base.lat, metresEast(10));
    expect(nearestOf([west, east], { lat: base.lat, lng: metresEast(8) })?.id).toBe('east');
  });
});
