import { z } from 'zod';
import { env } from '@/config/env';
import { messages } from '@/shared/i18n';
import type { LatLng, Maneuver, Route, RouteStep } from '../../types';

const OsrmStepSchema = z.object({
  distance: z.number(),
  name: z.string().default(''),
  maneuver: z.object({
    type: z.string(),
    modifier: z.string().optional(),
    exit: z.number().optional(),
    location: z.tuple([z.number(), z.number()]),
  }),
});

const OsrmResponseSchema = z.object({
  code: z.literal('Ok'),
  routes: z
    .array(
      z.object({
        distance: z.number(),
        duration: z.number(),
        geometry: z.object({ coordinates: z.array(z.tuple([z.number(), z.number()])).min(2) }),
        legs: z.array(z.object({ steps: z.array(OsrmStepSchema) })).min(1),
      }),
    )
    .min(1),
});

type OsrmStep = z.infer<typeof OsrmStepSchema>;

function maneuverOf({ maneuver: { type, modifier } }: OsrmStep): Maneuver {
  if (type === 'arrive') return 'arrive';
  if (type === 'depart') return 'depart';
  if (type === 'roundabout' || type === 'rotary' || type === 'roundabout turn') return 'roundabout';
  switch (modifier) {
    case 'uturn':
      return 'uturn';
    case 'slight left':
      return 'slight-left';
    case 'slight right':
      return 'slight-right';
    case 'left':
    case 'sharp left':
      return 'turn-left';
    case 'right':
    case 'sharp right':
      return 'turn-right';
    default:
      return 'straight';
  }
}

function instructionOf(step: OsrmStep): string {
  const t = messages().route;
  const { type, modifier, exit } = step.maneuver;
  const left = Boolean(modifier?.includes('left'));

  if (type === 'arrive') return t.arrive;
  if (type === 'roundabout' || type === 'rotary') return t.roundabout(exit ?? 1, step.name);
  if (modifier === 'uturn') return t.uturn(step.name);
  if (type === 'fork' || type === 'off ramp' || type === 'on ramp') return t.keep(left, step.name);
  if (type === 'merge') return t.merge(left, step.name);
  if (modifier === 'straight' || type === 'new name' || type === 'continue') return t.continueOnto(step.name);
  return t.turn(left, Boolean(modifier?.startsWith('slight')), step.name);
}

const toLatLng = ([lng, lat]: [number, number]): LatLng => ({ lat, lng });

/** Driving route along real roads from an OSRM server, mapped to the app's Route. */
export async function osrmRoute(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<Route> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${env.routingUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Routing failed: ${response.status}`);

  const [route] = OsrmResponseSchema.parse(await response.json()).routes;
  const osrmSteps = route.legs.flatMap((leg) => leg.steps);

  const steps: RouteStep[] = osrmSteps.slice(1).map((step, i) => ({
    maneuver: maneuverOf(step),
    instruction: instructionOf(step),
    location: toLatLng(step.maneuver.location),
    distanceMeters: osrmSteps[i].distance,
  }));

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry.coordinates.map(toLatLng),
    steps,
  };
}
