import { useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { LatLng } from '@/api/types';
import { boundsOf, toLngLat } from '@/shared/lib/geo';
import { useCameraStore, type CameraPadding, type MapCamera } from '../cameraStore';

export const MAP_ID = 'main';

export type { CameraPadding, MapCamera } from '../cameraStore';

export const OVERLAY_PADDING: CameraPadding = { top: 120, bottom: 150, left: 40, right: 40 };
export const OVERVIEW_ZOOM = 15.2;
const DURATION_MS = 900;

export function useMapCamera(): MapCamera {
  const { [MAP_ID]: map } = useMap();
  const fallback = useCameraStore((s) => s.fallback);

  const webgl = useMemo<MapCamera>(
    () => ({
      ready: Boolean(map),
      flyTo(center: LatLng, zoom = OVERVIEW_ZOOM): boolean {
        if (!map) return false;
        map.flyTo({ center: toLngLat(center), zoom, duration: DURATION_MS });
        return true;
      },
      fitTo(points: LatLng[], padding: CameraPadding = OVERLAY_PADDING, maxZoom = 16.5): boolean {
        if (!map || points.length === 0) return false;
        map.fitBounds(boundsOf(points), { padding, maxZoom, duration: DURATION_MS });
        return true;
      },
      follow(center: LatLng, bearing?: number | null) {
        map?.easeTo({
          center: toLngLat(center),
          zoom: Math.max(16, map.getZoom()),
          bearing: bearing ?? map.getBearing(),
          padding: { top: 220, bottom: 120, left: 0, right: 0 },
          duration: 800,
        });
      },
      resetNorth() {
        if (!map) return;
        const { top, bottom, left, right } = map.getPadding();
        if (map.getBearing() === 0 && !top && !bottom && !left && !right) return;
        map.easeTo({ bearing: 0, pitch: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
      },
    }),
    [map],
  );

  return fallback ?? webgl;
}
