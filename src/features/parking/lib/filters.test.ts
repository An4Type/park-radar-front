import type { ParkingPoint } from '@/api/types';
import { applyFilters, NO_FILTERS } from './filters';

const lot = (id: string, over: Partial<ParkingPoint>): ParkingPoint => ({
  id, name: id, address: '', lat: 50, lng: 20, capacity: 50, free: 10, accessibleSpaces: 0, freeAccessible: null, evChargingSpaces: 0, freeEv: null, paid: null, kind: null,
  active: true, confidence: null, updatedAt: null, ...over,
});

const lots = [
  lot('free-ev', { evChargingSpaces: 2 }),
  lot('full-ev-acc', { free: 0, evChargingSpaces: 4, accessibleSpaces: 2 }),
  lot('closed', { active: false, free: 0 }),
  lot('free-acc', { accessibleSpaces: 1 }),
];
const ids = (filters: Partial<typeof NO_FILTERS>) => applyFilters(lots, { ...NO_FILTERS, ...filters }).map((p) => p.id);

describe('parking filters', () => {
  it('shows everything without filters', () => expect(ids({})).toHaveLength(4));
  it('free now hides full and closed lots', () => expect(ids({ free: true })).toEqual(['free-ev', 'free-acc']));
  it('EV keeps lots with chargers', () => expect(ids({ ev: true })).toEqual(['free-ev', 'full-ev-acc']));
  it('accessible keeps lots with accessible spaces', () => expect(ids({ accessible: true })).toEqual(['full-ev-acc', 'free-acc']));
  it('combines filters with AND', () => expect(ids({ free: true, ev: true })).toEqual(['free-ev']));
});

describe('fee and type filters', () => {
  const extra = [
    lot('paid-outdoor', { paid: true, kind: 'OUTDOOR' }),
    lot('free-street', { paid: false, kind: 'STREET' }),
    lot('unknown', {}),
  ];
  const pick = (filters: Partial<typeof NO_FILTERS>) => applyFilters(extra, { ...NO_FILTERS, ...filters }).map((p) => p.id);

  it('filters by fee, excluding unknown fee', () => {
    expect(pick({ fee: 'paid' })).toEqual(['paid-outdoor']);
    expect(pick({ fee: 'free' })).toEqual(['free-street']);
  });

  it('filters by any of the chosen types', () => {
    expect(pick({ types: ['STREET', 'OUTDOOR'] })).toEqual(['paid-outdoor', 'free-street']);
  });
});
