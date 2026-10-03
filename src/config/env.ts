import { z } from 'zod';

const latLngPair = z
  .string()
  .regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, 'Expected "lat,lng"')
  .transform((value) => {
    const [lat, lng] = value.split(',').map(Number);
    return { lat, lng };
  });

const EnvSchema = z.object({
  VITE_API_MODE: z.enum(['mock', 'http']).default('mock'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8080/v1'),
  VITE_MAP_STYLE_URL: z.string().url().default('https://tiles.openfreemap.org/styles/positron'),
  VITE_DEFAULT_CENTER: latLngPair.default({ lat: 52.4083, lng: 16.9335 }),
});

const parsed = EnvSchema.parse(import.meta.env);

export const env = {
  apiMode: parsed.VITE_API_MODE,
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  mapStyleUrl: parsed.VITE_MAP_STYLE_URL,
  defaultCenter: parsed.VITE_DEFAULT_CENTER,
} as const;
