import { messages } from '@/shared/i18n';
import { bearingDegrees, distanceMeters, turnAngle } from '@/shared/lib/geo';
import type { LatLng, Maneuver, Route, RouteStep } from '../types';
import { STREETS } from './fixtures';
import { hashString } from './random';

const CITY_SPEED_MPS = 25 / 3.6;
const PARKING_OVERHEAD_S = 45;

const compass = (bearing: number) => Math.round(bearing / 45) % 8;

export function routeBetween(from: LatLng, to: LatLng): Route {
  const t = messages().route;
  const corner: LatLng = { lat: to.lat, lng: from.lng };
  const street = STREETS[hashString(`${to.lat.toFixed(4)},${to.lng.toFixed(4)}`) % STREETS.length];

  const firstLeg = distanceMeters(from, corner);
  const secondLeg = distanceMeters(corner, to);
  const useCorner = firstLeg > 30 && secondLeg > 30;

  const geometry = useCorner ? [from, corner, to] : [from, to];
  const steps: RouteStep[] = [];

  if (useCorner) {
    const angle = turnAngle(bearingDegrees(from, corner), bearingDegrees(corner, to));
    const maneuver: Maneuver = Math.abs(angle) < 25 ? 'straight' : angle < 0 ? 'turn-left' : 'turn-right';
    const instruction = maneuver === 'straight' ? t.continueOnto(street) : t.turn(maneuver === 'turn-left', false, street);
    steps.push({ maneuver, instruction, location: corner, distanceMeters: firstLeg });
  } else {
    steps.push({
      maneuver: 'depart',
      instruction: t.head(compass(bearingDegrees(from, to)), street),
      location: from,
      distanceMeters: 0,
    });
  }

  const lastLeg = useCorner ? secondLeg : distanceMeters(from, to);
  steps.push({ maneuver: 'arrive', instruction: t.arrive, location: to, distanceMeters: lastLeg });

  const distance = useCorner ? firstLeg + secondLeg : lastLeg;
  return {
    distanceMeters: distance,
    durationSeconds: distance / CITY_SPEED_MPS + PARKING_OVERHEAD_S,
    geometry,
    steps,
  };
}
