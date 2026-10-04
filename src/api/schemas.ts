import { z } from 'zod';

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const ParkingDtoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    address: z.string().nullish().transform((v) => v ?? ''),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    regularSpaces: z.number().int().nonnegative().nullish(),
    freeRegularSpaces: z.number().int().nonnegative().nullish(),
    disabledSpaces: z.number().int().nonnegative().nullish(),
    freeDisabledSpaces: z.number().int().nonnegative().nullish(),
    evChargerSpaces: z.number().int().nonnegative().nullish(),
    freeEvChargerSpaces: z.number().int().nonnegative().nullish(),
    totalSpaces: z.number().int().nonnegative().nullish(),
    occupiedSpaces: z.number().int().nonnegative().nullish(),
    freeSpaces: z.number().int().nonnegative().nullish(),
    accessibleSpaces: z.number().int().nonnegative().nullish(),
    evChargingSpaces: z.number().int().nonnegative().nullish(),
    isPaid: z.boolean().nullish().transform((v) => v ?? null),
    type: z.string().nullish().transform((v) => (v ? v.trim().toUpperCase() : null)),
    status: z.string(),
    confidence: z.number().min(0).max(1).nullish().transform((v) => v ?? null),
    lastUpdatedAt: z.string().datetime({ offset: true }).nullish().transform((v) => v ?? null),
  })
  .refine((p) => p.regularSpaces != null || p.totalSpaces != null, {
    message: 'Either regularSpaces or totalSpaces is required',
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
  detail: z.string().optional(),
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

export const ReportLevelSchema = z.enum(['none', 'few', 'many']);

export const ZoneDtoSchema = z.object({
  id: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  level: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(ReportLevelSchema),
  createdAt: z.string().datetime({ offset: true }).nullish().transform((v) => v ?? null),
  expiresAt: z.string().datetime({ offset: true }).nullish().transform((v) => v ?? null),
});

export const RawZonesResponseSchema = z.object({ zones: z.array(z.unknown()) });
