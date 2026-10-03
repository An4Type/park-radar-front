import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';
import type { ParkingPoint } from '@/api/types';
import { CELL_RESOLUTION, indexParking, pickInCell } from './cellIndex';

const base = latLngToCell(52.4083, 16.9335, CELL_RESOLUTION);
const neighbour = gridDisk(base, 1).find((c) => c !== base)!;
const far = gridDisk(base, 6).at(-1)!;

function pointIn(cell: string, id: string, offset = { lat: 0, lng: 0 }): ParkingPoint {
  const [lat, lng] = cellToLatLng(cell);
  return {
    id, name: id, address: '', lat: lat + offset.lat, lng: lng + offset.lng,
    capacity: 50, free: 10, active: true, confidence: 0.9, updatedAt: '2026-10-03T12:00:00Z',
  };
}

describe('indexParking', () => {
  it('draws one hex per facility cell and one shared outline for touching cells', () => {
    const { geometry } = indexParking([pointIn(base, 'a'), pointIn(neighbour, 'b'), pointIn(far, 'c')]);
    expect(geometry.cells).toHaveLength(3);
    expect(geometry.clusters).toHaveLength(2);
    expect(geometry.clusters.find((c) => c.polygon[0][0].length > 7)).toBeDefined();
  });

  it('keeps merged facilities separately selectable', () => {
    const index = indexParking([pointIn(base, 'a'), pointIn(neighbour, 'b')]);
    expect(index.byId.get('a')?.id).toBe('a');
    expect(index.byId.get('b')?.id).toBe('b');
    expect(pickInCell(index, base, index.byId.get('a')!)?.id).toBe('a');
    expect(pickInCell(index, neighbour, index.byId.get('b')!)?.id).toBe('b');
  });

  it('picks the nearest facility when two share a cell', () => {
    const west = pointIn(base, 'west', { lat: 0, lng: -0.0001 });
    const east = pointIn(base, 'east', { lat: 0, lng: 0.0001 });
    const index = indexParking([west, east]);
    expect(pickInCell(index, base, { lat: east.lat, lng: east.lng + 0.00002 })?.id).toBe('east');
  });

  it('reuses geometry when only availability changes', () => {
    const first = indexParking([pointIn(base, 'a')]);
    const second = indexParking([{ ...pointIn(base, 'a'), free: 3 }]);
    expect(second.geometry).toBe(first.geometry);
    expect(second.byId.get('a')?.free).toBe(3);
  });
});
