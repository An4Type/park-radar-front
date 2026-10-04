import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { ParkingPoint } from '@/api/types';
import { pointLevel } from '@/features/parking/lib/availability';

export function HexStates({ sourceId, points }: { sourceId: string; points: ParkingPoint[] }) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map?.getSource(sourceId)) return;
    for (const point of points) {
      map.setFeatureState({ source: sourceId, id: point.id }, { level: point.active ? pointLevel(point) : 'full' });
    }
  }, [map, sourceId, points]);

  return null;
}
