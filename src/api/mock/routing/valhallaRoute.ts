import { z } from 'zod';
import { env } from '@/config/env';
import type { LatLng, Maneuver, Route, RouteStep } from '../../types';
import { decodePolyline } from './polyline';

const ValhallaManeuverSchema = z.object({
  type: z.number(),
  instruction: z.string().default(''),
  length: z.number(),
  begin_shape_index: z.number(),
});

const ValhallaResponseSchema = z.object({
  trip: z.object({
    summary: z.object({ length: z.number(), time: z.number() }),
    legs: z.array(z.object({ shape: z.string(), maneuvers: z.array(ValhallaManeuverSchema).min(1) })).min(1),
  }),
});

const ARRIVE = new Set([4, 5, 6]);

function maneuverOf(type: number): Maneuver {
  if (ARRIVE.has(type)) return 'arrive';
  switch (type) {
    case 1:
    case 2:
    case 3:
      return 'depart';
    case 9:
    case 18:
    case 20:
    case 23:
      return 'slight-right';
    case 16:
    case 19:
    case 21:
    case 24:
      return 'slight-left';
    case 10:
    case 11:
      return 'turn-right';
    case 14:
    case 15:
      return 'turn-left';
    case 12:
    case 13:
      return 'uturn';
    case 26:
    case 27:
      return 'roundabout';
    default:
      return 'straight';
  }
}

export async function valhallaRoute(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<Route> {
  const request = {
    locations: [
      { lat: from.lat, lon: from.lng },
      { lat: to.lat, lon: to.lng },
    ],
    costing: 'auto',
    units: 'kilometers',
  };
  const url = `${env.valhallaUrl}/route?json=${encodeURIComponent(JSON.stringify(request))}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Valhalla failed: ${response.status}`);

  const { trip } = ValhallaResponseSchema.parse(await response.json());
  const legs = trip.legs;
  const geometry = legs.flatMap((leg) => decodePolyline(leg.shape));
  const shapes = legs.map((leg) => decodePolyline(leg.shape));
  const maneuvers = legs.flatMap((leg, legIndex) =>
    leg.maneuvers.map((m) => ({ ...m, location: shapes[legIndex][Math.min(m.begin_shape_index, shapes[legIndex].length - 1)] })),
  );

  const steps: RouteStep[] = maneuvers.slice(1).map((m, i) => {
    const maneuver = maneuverOf(m.type);
    return {
      maneuver,
      instruction: maneuver === 'arrive' ? 'Arrive at parking' : m.instruction.replace(/\.$/, ''),
      location: m.location,
      distanceMeters: maneuvers[i].length * 1000,
    };
  });

  return {
    distanceMeters: trip.summary.length * 1000,
    durationSeconds: trip.summary.time,
    geometry,
    steps: steps.length ? steps : [{ maneuver: 'arrive', instruction: 'Arrive at parking', location: to, distanceMeters: 0 }],
  };
}
