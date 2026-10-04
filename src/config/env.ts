import { z } from 'zod';

const latLngPair = z
  .string()
  .regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, 'Expected "lat,lng"')
  .transform((value) => {
    const [lat, lng] = value.split(',').map(Number);
    return { lat, lng };
  });

const EnvSchema = z.object({
  VITE_API_MODE: z.enum(['mock', 'hybrid', 'http']).default('mock'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8080/v1'),
  VITE_MAP_STYLE_URL: z.string().url().default('https://tiles.openfreemap.org/styles/positron'),
  VITE_ROUTING_URL: z.string().url().default('https://router.project-osrm.org'),
  VITE_VALHALLA_URL: z.string().url().default('https://valhalla1.openstreetmap.de'),
  VITE_DEFAULT_CENTER: latLngPair.default({ lat: 50.0677, lng: 19.9916 }),
  VITE_DEFAULT_CENTER_NAME: z.string().default('Tauron Arena'),
});

const parsed = EnvSchema.parse(import.meta.env);

export const env = {
  apiMode: parsed.VITE_API_MODE,
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  mapStyleUrl: parsed.VITE_MAP_STYLE_URL,
  routingUrl: parsed.VITE_ROUTING_URL,
  valhallaUrl: parsed.VITE_VALHALLA_URL,
  defaultCenter: parsed.VITE_DEFAULT_CENTER,
  defaultCenterName: parsed.VITE_DEFAULT_CENTER_NAME,
} as const;
