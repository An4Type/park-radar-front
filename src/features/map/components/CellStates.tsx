import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { ParkingPoint } from '@/api/types';
import { availabilityLevel } from '@/features/parking/lib/availability';
import { cellTotals } from '@/features/parking/lib/cellIndex';

export function CellStates({ sourceId, byCell }: { sourceId: string; byCell: Map<string, ParkingPoint[]> }) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map?.getSource(sourceId)) return;
    for (const [cell, points] of byCell) {
      const { free, capacity } = cellTotals(points);
      map.setFeatureState({ source: sourceId, id: cell }, { level: availabilityLevel(free, capacity) });
    }
  }, [map, sourceId, byCell]);

  return null;
}
