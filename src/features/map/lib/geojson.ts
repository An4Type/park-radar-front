import { cellToBoundary } from 'h3-js';
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from 'geojson';
import type { LatLng, ParkingPoint, Route } from '@/api/types';
import type { CellShape, ClusterOutline } from '@/features/parking/model';
import { toLngLat } from '@/shared/lib/geo';

export function cellsToFeatures(cells: CellShape[]): FeatureCollection<Polygon, { id: string }> {
  return {
    type: 'FeatureCollection',
    features: cells.map((cell) => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [cell.ring] },
      properties: { id: cell.id },
    })),
  };
}

export function clustersToFeatures(clusters: ClusterOutline[]): FeatureCollection<MultiPolygon, { id: string }> {
  return {
    type: 'FeatureCollection',
    features: clusters.map((cluster) => ({
      type: 'Feature',
      geometry: { type: 'MultiPolygon', coordinates: cluster.polygon },
      properties: { id: cluster.id },
    })),
  };
}

export function pointsToHeat(points: ParkingPoint[]): FeatureCollection<Point, { weight: number }> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
      properties: {
        weight: point.capacity > 0 ? (point.free / point.capacity) * Math.min(1, Math.log10(1 + point.capacity) / 2.5) : 0,
      },
    })),
  };
}

export function routeToLine(route: Route): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: route.geometry.map(toLngLat) },
  };
}

export const cellPoints = (cell: string): LatLng[] => cellToBoundary(cell).map(([lat, lng]) => ({ lat, lng }));
