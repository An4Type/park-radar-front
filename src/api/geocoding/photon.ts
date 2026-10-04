import { z } from 'zod';
import { distanceMeters } from '@/shared/lib/geo';
import type { Destination, LatLng } from '../types';

const PHOTON = 'https://photon.komoot.io/api/';
const TIMEOUT_MS = 5_000;
const DUPLICATE_M = 60;

const FeatureSchema = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    osm_id: z.number().optional(),
    osm_type: z.string().optional(),
    name: z.string().optional(),
    street: z.string().optional(),
    housenumber: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    type: z.string().optional(),
  }),
});

const ResponseSchema = z.object({ features: z.array(z.unknown()) });

function toDestination(raw: unknown): Destination | null {
  const parsed = FeatureSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { properties: p, geometry } = parsed.data;
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  const name = p.name || street;
  if (!name) return null;
  const detail = [p.name && street && street !== p.name ? street : null, p.district, p.city].filter(Boolean).join(', ');
  const [lng, lat] = geometry.coordinates;
  return {
    id: `osm-${p.osm_type ?? 'x'}${p.osm_id ?? `${lat},${lng}`}`,
    name,
    detail: detail || undefined,
    location: { lat, lng },
  };
}

export async function searchPlaces(query: string, near: LatLng, signal?: AbortSignal): Promise<Destination[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const params = new URLSearchParams({ q, lat: String(near.lat), lon: String(near.lng), limit: '10', lang: 'en' });
    const response = await fetch(`${PHOTON}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Photon ${response.status}`);
    const { features } = ResponseSchema.parse(await response.json());

    const results: Destination[] = [];
    for (const feature of features) {
      const place = toDestination(feature);
      if (!place) continue;
      const duplicate = results.some(
        (r) => r.name === place.name && distanceMeters(r.location, place.location) < DUPLICATE_M,
      );
      if (!duplicate) results.push(place);
    }
    return results.slice(0, 8);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
