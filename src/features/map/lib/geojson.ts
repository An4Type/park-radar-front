import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from 'geojson';
import type { LatLng, ParkingPoint } from '@/api/types';
import type { HexShape, MultiPolygonCoords } from '@/features/parking/model';
import { toLngLat } from '@/shared/lib/geo';

export function hexesToFeatures(hexes: HexShape[]): FeatureCollection<Polygon, { id: string }> {
  return {
    type: 'FeatureCollection',
    features: hexes.map((hex) => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [hex.ring] },
      properties: { id: hex.id },
    })),
  };
}

export function outlineToFeature(outline: MultiPolygonCoords): FeatureCollection<MultiPolygon> {
  return {
    type: 'FeatureCollection',
    features: outline.length ? [{ type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: outline }, properties: {} }] : [],
  };
}

export function heatWeight(point: Pick<ParkingPoint, 'free' | 'active'>): number {
  if (!point.active || point.free <= 0) return 0;
  return Math.min(1, Math.log10(1 + point.free) / 2);
}

export interface PointProps {
  id: string;
  free: number;
  active: boolean;
  accessible: number;
  ev: number;
  weight: number;
}

export function pointsToFeatures(points: ParkingPoint[]): FeatureCollection<Point, PointProps> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
      properties: {
        id: point.id,
        free: point.free,
        active: point.active,
        accessible: point.accessibleSpaces,
        ev: point.evChargingSpaces,
        weight: heatWeight(point),
      },
    })),
  };
}

export function lineOf(points: LatLng[]): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: points.map(toLngLat) },
  };
}
