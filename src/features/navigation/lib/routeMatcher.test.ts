import type { Route } from '@/api/types';
import { distanceMeters } from '@/shared/lib/geo';
import { OFF_ROUTE_M, prepareRoute, progressAt, remainingLine, snapToRoute } from './routeMatcher';

const start = { lat: 50.0, lng: 20.0 };
const corner = { lat: 50.0, lng: 20.01 };
const end = { lat: 50.005, lng: 20.01 };

const route: Route = {
  distanceMeters: distanceMeters(start, corner) + distanceMeters(corner, end),
  durationSeconds: 200,
  geometry: [start, corner, end],
  steps: [
    { maneuver: 'turn-left', instruction: 'Turn left onto North St', location: corner, distanceMeters: distanceMeters(start, corner) },
    { maneuver: 'arrive', instruction: 'Arrive at parking', location: end, distanceMeters: distanceMeters(corner, end) },
  ],
};

describe('routeMatcher', () => {
  const prepared = prepareRoute(route);

  it('snaps a noisy fix onto the road and keeps the road direction', () => {
    const noisy = { lat: 50.0001, lng: 20.004 };
    const snap = snapToRoute(prepared, noisy);
    expect(snap.point.lat).toBeCloseTo(50.0, 6);
    expect(snap.point.lng).toBeCloseTo(20.004, 6);
    expect(snap.offsetMeters).toBeLessThan(15);
    expect(snap.bearing).toBeCloseTo(90, 0);
  });

  it('reports being off the route when far from the road', () => {
    const away = { lat: 50.002, lng: 20.004 };
    expect(snapToRoute(prepared, away).offsetMeters).toBeGreaterThan(OFF_ROUTE_M);
  });

  it('measures distance to the next maneuver along the road', () => {
    const snap = snapToRoute(prepared, { lat: 50.0, lng: 20.005 });
    const progress = progressAt(prepared, snap.along);
    expect(progress.stepIndex).toBe(0);
    expect(progress.distanceToStepMeters).toBeCloseTo(distanceMeters({ lat: 50, lng: 20.005 }, corner), -1);
  });

  it('moves to the next step after passing the maneuver', () => {
    const snap = snapToRoute(prepared, { lat: 50.001, lng: 20.01 });
    const progress = progressAt(prepared, snap.along);
    expect(progress.stepIndex).toBe(1);
    expect(progress.arrived).toBe(false);
  });

  it('arrives near the end of the route', () => {
    const snap = snapToRoute(prepared, { lat: 50.0049, lng: 20.01 });
    expect(progressAt(prepared, snap.along).arrived).toBe(true);
  });

  it('trims the route line behind the user', () => {
    const snap = snapToRoute(prepared, { lat: 50.0, lng: 20.005 });
    const line = remainingLine(prepared, snap);
    expect(line[0]).toEqual(snap.point);
    expect(line.at(-1)).toEqual(end);
    expect(line).toHaveLength(3);
  });
});
