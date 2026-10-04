import { z } from 'zod';
import type { LatLng } from '@/api/types';
import { currentLanguage } from '@/shared/i18n';
import { roundLatLng } from '@/shared/lib/geo';

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 4_000;

const AddressSchema = z.object({
  display_name: z.string().optional(),
  address: z
    .object({
      road: z.string().optional(),
      pedestrian: z.string().optional(),
      house_number: z.string().optional(),
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
    })
    .optional(),
});

const cache = new Map<string, string>();

export function formatAddress(data: z.infer<typeof AddressSchema>): string {
  const a = data.address ?? {};
  const street = a.road ?? a.pedestrian;
  const city = a.city ?? a.town ?? a.village;
  const line = [street, a.house_number].filter(Boolean).join(' ');
  return [line, city].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || '';
}

export async function reverseGeocode(point: LatLng, signal?: AbortSignal): Promise<string> {
  const rounded = roundLatLng(point, 4);
  const language = currentLanguage();
  const key = `${language}:${rounded.lat},${rounded.lng}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    const url = `${NOMINATIM}?format=jsonv2&zoom=18&addressdetails=1&accept-language=${language}&lat=${rounded.lat}&lon=${rounded.lng}`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return '';
    const address = formatAddress(AddressSchema.parse(await response.json()));
    cache.set(key, address);
    return address;
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
