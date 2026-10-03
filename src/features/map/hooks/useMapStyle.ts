import { useQuery } from '@tanstack/react-query';
import type { StyleSpecification } from 'maplibre-gl';
import { env } from '@/config/env';
import { FALLBACK_STYLE, themeMapStyle } from '../lib/mapTheme';

export function useMapStyle(): StyleSpecification | undefined {
  const { data, isError } = useQuery({
    queryKey: ['map-style', env.mapStyleUrl],
    queryFn: async ({ signal }) => {
      const response = await fetch(env.mapStyleUrl, { signal });
      if (!response.ok) throw new Error(`Map style ${response.status}`);
      return themeMapStyle((await response.json()) as StyleSpecification);
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });
  return isError ? FALLBACK_STYLE : data;
}
