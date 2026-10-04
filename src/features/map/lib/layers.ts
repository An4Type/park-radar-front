import type { LayerProps } from 'react-map-gl/maplibre';
import type { LayerMode } from '../mapStore';
import { MAP_COLORS } from './mapTheme';

export const AUTO_HEAT_UNTIL = 13.6;
export const AUTO_HEXES_FROM = 14.4;

const level = ['feature-state', 'level'];
const levelOpacity = ['match', level, 'many', 0.36, 'some', 0.22, 'few', 0.12, 'full', 0.1, 0];

const fadeIn = (value: unknown) => ['interpolate', ['linear'], ['zoom'], AUTO_HEAT_UNTIL, 0, AUTO_HEXES_FROM, value];
const fadeOut = (value: unknown) => ['interpolate', ['linear'], ['zoom'], AUTO_HEAT_UNTIL, value, AUTO_HEXES_FROM, 0];

export const HEX_FILL_LAYER_ID = 'hexes-fill';
export const DOT_LAYER_ID = 'parking-dots';

export interface ParkingLayers {
  hexFill: LayerProps;
  outline: LayerProps;
  dots: LayerProps;
  heat: LayerProps;
  showHexes: boolean;
  showHeat: boolean;
}

export const HEAT_ALPHA_STOPS: ReadonlyArray<[number, number]> = [
  [0, 0],
  [0.1, 0.06],
  [0.3, 0.18],
  [0.6, 0.32],
  [1, 0.5],
];

const HEAT_COLOR = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  ...HEAT_ALPHA_STOPS.flatMap(([density, alpha]) => [density, `rgba(36,99,235,${alpha})`]),
];

export const HEAT_RADIUS_M = 120;
const METERS_PER_PX_Z0 = 78_271.5 * Math.cos((50 * Math.PI) / 180);

const heatRadius = [
  'interpolate',
  ['exponential', 2],
  ['zoom'],
  ...[11, 13, 15, 17, 19].flatMap((z) => [z, Math.round((HEAT_RADIUS_M / (METERS_PER_PX_Z0 / 2 ** z)) * 10) / 10]),
];

export function parkingLayers(mode: LayerMode, navigating: boolean): ParkingLayers {
  const auto = mode === 'auto';
  const showHexes = !navigating && (auto || mode === 'zones');
  const showHeat = !navigating && (auto || mode === 'heat');
  const hexOpacity = (value: unknown) => (auto ? fadeIn(value) : value);
  const vis = (visible: boolean) => (visible ? 'visible' : 'none');

  const layers = {
    hexFill: {
      id: HEX_FILL_LAYER_ID,
      type: 'fill',
      layout: { visibility: vis(showHexes) },
      paint: {
        'fill-color': ['match', level, 'full', MAP_COLORS.danger, MAP_COLORS.primary],
        'fill-opacity': hexOpacity(levelOpacity),
      },
    },
    outline: {
      id: 'hexes-outline',
      type: 'line',
      layout: { 'line-join': 'round', visibility: vis(showHexes) },
      paint: { 'line-color': MAP_COLORS.primary, 'line-opacity': hexOpacity(0.5), 'line-width': 1.5 },
    },
    dots: {
      id: DOT_LAYER_ID,
      type: 'circle',
      layout: { visibility: vis(showHexes) },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2.5, 16, 4.5, 18, 6],
        'circle-color': ['case', ['get', 'active'], MAP_COLORS.primary, MAP_COLORS.danger],
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1.5,
        'circle-opacity': hexOpacity(1),
        'circle-stroke-opacity': hexOpacity(1),
      },
    },
    heat: {
      id: 'parking-heat',
      type: 'heatmap',
      layout: { visibility: vis(showHeat) },
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': 1,
        'heatmap-radius': heatRadius,
        'heatmap-opacity': auto ? fadeOut(1) : 1,
        'heatmap-color': HEAT_COLOR,
      },
    },
  };
  return { ...(layers as unknown as Omit<ParkingLayers, 'showHexes' | 'showHeat'>), showHexes, showHeat };
}

export const selectedOutline = {
  id: 'hex-selected',
  type: 'line',
  paint: {
    'line-color': MAP_COLORS.primary,
    'line-width': 3.5,
  },
  layout: { 'line-join': 'round' },
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


const LABEL_FONT = ['Noto Sans Bold'];

export const PARKING_LABEL_LAYER_ID = 'labels-parking';

export interface LabelVisibility {
  free: boolean;
  accessible: boolean;
  ev: boolean;
}

type Section = unknown[];

const freeSection: Section = [
  ['image', 'pr-p'],
  {},
  ' ',
  {},
  ['case', ['get', 'active'], ['to-string', ['get', 'free']], 'Closed'],
  { 'text-color': ['case', ['>', ['get', 'free'], 0], MAP_COLORS.ink, MAP_COLORS.danger] },
];

const countSection = (image: string, key: string): Section => [['image', image], {}, ' ', {}, ['to-string', ['get', key]], {}];

function formatted(show: LabelVisibility, withEv: boolean, withAccessible: boolean) {
  const sections: Section[] = [];
  if (show.free) sections.push(freeSection);
  if (withEv) sections.push(countSection('pr-ev', 'ev'));
  if (withAccessible) sections.push(countSection('pr-accessible', 'accessible'));
  const parts = sections.flatMap((section, i) => (i === 0 ? section : ['\n', {}, ...section]));
  return ['format', ...(parts.length ? parts : ['', {}])];
}

export function parkingLabels(show: LabelVisibility): { layer: LayerProps; visible: boolean } {
  const hasEv = ['>', ['get', 'ev'], 0];
  const hasAccessible = ['>', ['get', 'accessible'], 0];
  const ev = show.ev;
  const acc = show.accessible;

  const textField =
    ev && acc
      ? ['case', ['all', hasEv, hasAccessible], formatted(show, true, true), hasEv, formatted(show, true, false), hasAccessible, formatted(show, false, true), formatted(show, false, false)]
      : ev
        ? ['case', hasEv, formatted(show, true, false), formatted(show, false, false)]
        : acc
          ? ['case', hasAccessible, formatted(show, false, true), formatted(show, false, false)]
          : formatted(show, false, false);

  const filter = show.free ? ['has', 'id'] : ['any', ...(ev ? [hasEv] : []), ...(acc ? [hasAccessible] : []), false];

  const visible = show.free || ev || acc;
  const layer = {
    id: PARKING_LABEL_LAYER_ID,
    type: 'symbol',
    minzoom: 14.5,
    filter,
    layout: {
      'icon-image': 'pr-pill',
      'icon-text-fit': 'both',
      'text-font': LABEL_FONT,
      'text-size': 13,
      'text-padding': 3,
      'text-anchor': 'bottom',
      'text-offset': [0, -0.9],
      'text-justify': 'left',
      'text-line-height': 1.35,
      'symbol-sort-key': ['-', ['get', 'free']],
      'text-field': textField,
      visibility: visible ? 'visible' : 'none',
    },
    paint: { 'text-color': MAP_COLORS.ink },
  };
  return { layer: layer as unknown as LayerProps, visible };
}

export const REPORT_FILL_LAYER_ID = 'reports-fill';
export const REPORT_LABEL_LAYER_ID = 'reports-labels';

const reportLevel = ['get', 'level'];

export const reportFill = {
  id: REPORT_FILL_LAYER_ID,
  type: 'fill',
  paint: {
    'fill-color': ['match', reportLevel, 'none', MAP_COLORS.danger, MAP_COLORS.primary],
    'fill-opacity': ['match', reportLevel, 'many', 0.26, 'few', 0.12, 0.12],
  },
} as unknown as LayerProps;

export const reportOutline = {
  id: 'reports-outline',
  type: 'line',
  layout: { 'line-join': 'round' },
  paint: {
    'line-color': ['match', reportLevel, 'none', MAP_COLORS.danger, MAP_COLORS.primary],
    'line-width': 2,
    'line-dasharray': [2, 1.5],
  },
} as unknown as LayerProps;

export const reportLabels = {
  id: REPORT_LABEL_LAYER_ID,
  type: 'symbol',
  minzoom: 13.5,
  layout: {
    'icon-image': 'pr-pill',
    'icon-text-fit': 'both',
    'text-font': ['Noto Sans Bold'],
    'text-size': 12,
    'text-anchor': 'bottom',
    'text-offset': [0, -0.9],
    'text-allow-overlap': false,
    'text-field': [
      'format',
      ['image', 'pr-report'],
      {},
      ' ',
      {},
      ['match', reportLevel, 'many', 'Many', 'few', 'Few', 'None'],
      { 'text-color': ['match', reportLevel, 'none', MAP_COLORS.danger, MAP_COLORS.ink] },
    ],
  },
} as unknown as LayerProps;

export function withVisibility(layer: LayerProps, visible: boolean): LayerProps {
  const { layout } = layer as { layout?: Record<string, unknown> };
  return { ...layer, layout: { ...layout, visibility: visible ? 'visible' : 'none' } } as LayerProps;
}
