import type { LayerProps } from 'react-map-gl/maplibre';
import { MAP_COLORS } from './mapTheme';

const level = ['feature-state', 'level'] as const;
const levelOpacity = ['match', level, 'many', 0.36, 'some', 0.22, 'few', 0.12, 'full', 0.1, 0] as const;

export const CELL_FILL_LAYER_ID = 'cells-fill';

export const cellFill = {
  id: CELL_FILL_LAYER_ID,
  type: 'fill',
  paint: {
    'fill-color': ['match', level, 'full', MAP_COLORS.danger, MAP_COLORS.primary] as unknown as string,
    'fill-opacity': levelOpacity as unknown as number,
    'fill-opacity-transition': { duration: 600 },
  },
} satisfies LayerProps;

export const clusterOutline = {
  id: 'clusters-outline',
  type: 'line',
  paint: {
    'line-color': MAP_COLORS.primary,
    'line-opacity': 0.45,
    'line-width': 1.5,
  },
  layout: { 'line-join': 'round' },
} satisfies LayerProps;

export const selectedOutline = {
  id: 'cell-selected',
  type: 'line',
  paint: {
    'line-color': MAP_COLORS.primary,
    'line-width': 3.5,
  },
  layout: { 'line-join': 'round' },
} satisfies LayerProps;

export const softHeat = {
  id: 'parking-heat',
  type: 'heatmap',
  paint: {
    'heatmap-weight': ['get', 'weight'],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 12, 0.9, 16, 1.4],
    'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 12, 28, 14, 72, 16, 260, 18, 1000],
    'heatmap-opacity': 0.85,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(36,99,235,0)',
      0.2,
      'rgba(227,234,252,0.55)',
      0.45,
      'rgba(185,204,248,0.7)',
      0.7,
      'rgba(127,162,243,0.8)',
      1,
      'rgba(36,99,235,0.85)',
    ],
  },
} satisfies LayerProps;

export const routeCasing = {
  id: 'route-casing',
  type: 'line',
  paint: { 'line-color': '#FFFFFF', 'line-width': 12 },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
} satisfies LayerProps;

export const routeLine = {
  id: 'route-line',
  type: 'line',
  paint: { 'line-color': MAP_COLORS.primary, 'line-width': 7 },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
} satisfies LayerProps;

export const visibility = (visible: boolean) => (visible ? 'visible' : 'none') as 'visible' | 'none';
