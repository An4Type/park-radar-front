import { z } from 'zod';

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const ParkingDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullish().transform((v) => v ?? ''),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  totalSpaces: z.number().int().nonnegative(),
  occupiedSpaces: z.number().int().nonnegative(),
  freeSpaces: z.number().int().nonnegative(),
  accessibleSpaces: z.number().int().nonnegative().default(0),
  evChargingSpaces: z.number().int().nonnegative().default(0),
  status: z.string(),
  confidence: z.number().min(0).max(1).nullish().transform((v) => v ?? null),
  lastUpdatedAt: z.string().datetime({ offset: true }).nullish().transform((v) => v ?? null),
});

export const ParkingResponseSchema = z.object({
  parking: z.array(ParkingDtoSchema),
});

export const RawParkingResponseSchema = z.object({
  parking: z.array(z.unknown()),
});

export const DestinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: LatLngSchema,
});

export const DestinationListSchema = z.array(DestinationSchema);

export const ManeuverSchema = z.enum([
  'depart',
  'straight',
  'slight-left',
  'slight-right',
  'turn-left',
  'turn-right',
  'uturn',
  'roundabout',
  'arrive',
]);

export const RouteStepSchema = z.object({
  maneuver: ManeuverSchema,
  instruction: z.string(),
  location: LatLngSchema,
  distanceMeters: z.number().nonnegative(),
});

export const RouteSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  geometry: z.array(LatLngSchema).min(2),
  steps: z.array(RouteStepSchema).min(1),
});
