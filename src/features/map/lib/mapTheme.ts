import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

export const MAP_COLORS = {
  ground: '#F1F2F4',
  park: '#E4EEDF',
  water: '#DCE4EE',
  building: '#E8EAED',
  road: '#FFFFFF',
  roadCasing: '#E3E5E9',
  label: '#868C96',
  labelHalo: '#F1F2F4',
  ink: '#14171C',
  primary: '#2463EB',
  danger: '#C0262D',
} as const;

const is = (id: string, pattern: RegExp) => pattern.test(id.toLowerCase());

function themeLayer(layer: LayerSpecification): LayerSpecification | null {
  const { id } = layer;
  switch (layer.type) {
    case 'background':
      return { ...layer, paint: { ...layer.paint, 'background-color': MAP_COLORS.ground } };
    case 'fill': {
      let color: string | undefined;
      if (is(id, /water|ocean|river|lake/)) color = MAP_COLORS.water;
      else if (is(id, /park|grass|wood|forest|garden|cemetery|pitch|landcover|nature/)) color = MAP_COLORS.park;
      else if (is(id, /building/)) color = MAP_COLORS.building;
      else if (is(id, /landuse|residential|industrial|commercial|aeroway/)) color = MAP_COLORS.ground;
      return color ? { ...layer, paint: { ...layer.paint, 'fill-color': color, 'fill-outline-color': color } } : layer;
    }
    case 'line': {
      if (is(id, /rail|boundary|admin/)) return layer;
      if (is(id, /water|river|stream|canal/)) {
        return { ...layer, paint: { ...layer.paint, 'line-color': MAP_COLORS.water } };
      }
      if (is(id, /casing|outline/)) {
        return { ...layer, paint: { ...layer.paint, 'line-color': MAP_COLORS.roadCasing } };
      }
      if (is(id, /road|highway|street|bridge|tunnel|path|transportation|motorway|primary|secondary|minor/)) {
        return { ...layer, paint: { ...layer.paint, 'line-color': MAP_COLORS.road } };
      }
      return layer;
    }
    case 'symbol': {
      if (is(id, /poi|amenity|shop/)) return null;
      return {
        ...layer,
        paint: {
          ...layer.paint,
          'text-color': MAP_COLORS.label,
          'text-halo-color': MAP_COLORS.labelHalo,
          'text-halo-width': 1.4,
        },
      };
    }
    default:
      return layer;
  }
}

const CAR_CLASSES = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'] as const;
type CarClass = (typeof CAR_CLASSES)[number];

const ROAD_WIDTHS: Record<number, Record<CarClass, number>> = {
  10: { motorway: 1.6, trunk: 1.4, primary: 1.1, secondary: 0.9, tertiary: 0.6, minor: 0, service: 0 },
  13: { motorway: 3.2, trunk: 2.8, primary: 2.4, secondary: 2, tertiary: 1.5, minor: 0.8, service: 0.3 },
  15: { motorway: 6, trunk: 5.5, primary: 5, secondary: 4.4, tertiary: 3.8, minor: 2.6, service: 1.2 },
  17: { motorway: 13, trunk: 12, primary: 11, secondary: 10, tertiary: 9, minor: 7, service: 3.5 },
  19: { motorway: 30, trunk: 28, primary: 26, secondary: 24, tertiary: 22, minor: 18, service: 9 },
};
const CASING_EXTRA: Record<number, number> = { 10: 0.6, 13: 1, 15: 1.6, 17: 2.4, 19: 3 };

const roadClass = ['get', 'class'];

function widthExpression(extra: (zoom: number) => number) {
  const stops = Object.entries(ROAD_WIDTHS).flatMap(([zoom, widths]) => {
    const z = Number(zoom);
    const byClass = CAR_CLASSES.flatMap((cls) => [cls, widths[cls] > 0 ? widths[cls] + extra(z) : 0]);
    return [z, ['match', roadClass, ...byClass, 0]];
  });
  return ['interpolate', ['exponential', 1.5], ['zoom'], ...stops] as unknown as number;
}

const isCarRoad = ['match', roadClass, [...CAR_CLASSES], true, false];
const isLine = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const isTunnel = ['==', ['get', 'brunnel'], 'tunnel'];
const rank = ['match', roadClass, 'motorway', 7, 'trunk', 6, 'primary', 5, 'secondary', 4, 'tertiary', 3, 'minor', 2, 1];

function carRoadLayers(source: string, font: string[]): LayerSpecification[] {
  const base = { source, 'source-layer': 'transportation' } as const;
  const layout = { 'line-cap': 'round', 'line-join': 'round', 'line-sort-key': rank } as const;
  const tunnel = ['all', isLine, isCarRoad, isTunnel];
  const surface = ['all', isLine, isCarRoad, ['!', isTunnel]];
  return [
    {
      ...base,
      id: 'pr-road-tunnel',
      type: 'line',
      filter: tunnel,
      layout,
      paint: { 'line-color': MAP_COLORS.roadCasing, 'line-width': widthExpression(() => 0), 'line-opacity': 0.6 },
    },
    {
      ...base,
      id: 'pr-road-casing',
      type: 'line',
      filter: surface,
      layout,
      paint: { 'line-color': MAP_COLORS.roadCasing, 'line-width': widthExpression((z) => CASING_EXTRA[z]) },
    },
    {
      ...base,
      id: 'pr-road',
      type: 'line',
      filter: surface,
      layout,
      paint: { 'line-color': MAP_COLORS.road, 'line-width': widthExpression(() => 0) },
    },
    {
      ...base,
      id: 'pr-road-oneway',
      type: 'symbol',
      minzoom: 16,
      filter: ['all', isLine, isCarRoad, ['match', ['get', 'oneway'], [1, -1], true, false]],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 90,
        'text-field': ['match', ['get', 'oneway'], -1, '‹', '›'],
        'text-font': font,
        'text-size': 14,
        'text-keep-upright': false,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: { 'text-color': '#B7BCC4' },
    },
  ] as LayerSpecification[];
}

const isOriginalRoad = (layer: LayerSpecification) =>
  'source-layer' in layer &&
  layer['source-layer'] === 'transportation' &&
  (layer.type === 'line' || layer.type === 'fill') &&
  !/rail/.test(layer.id);

const HIDDEN_LAYERS = /^(highway-name-path|road_pier|road_area_pier)$/;

export function themeMapStyle(style: StyleSpecification): StyleSpecification {
  const firstRoad = style.layers.find(isOriginalRoad);
  const source = firstRoad && 'source' in firstRoad ? String(firstRoad.source) : null;
  const firstSymbol = style.layers.find((l) => l.type === 'symbol' && l.layout?.['text-font']);
  const font = (firstSymbol?.type === 'symbol' && (firstSymbol.layout?.['text-font'] as string[])) || ['Noto Sans Regular'];

  const layers: LayerSpecification[] = [];
  let roadsInserted = false;
  for (const layer of style.layers) {
    if (HIDDEN_LAYERS.test(layer.id)) continue;
    if (source && isOriginalRoad(layer)) {
      if (!roadsInserted) {
        layers.push(...carRoadLayers(source, font));
        roadsInserted = true;
      }
      continue;
    }
    const themed = themeLayer(layer);
    if (themed) layers.push(themed);
  }
  return { ...style, layers };
}

export const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': MAP_COLORS.ground } }],
};
