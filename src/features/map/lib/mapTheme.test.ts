import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';
import { themeMapStyle } from './mapTheme';

const isLine = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];

const baseStyle = {
  version: 8,
  glyphs: 'https://example.com/fonts/{fontstack}/{range}.pbf',
  sources: { openmaptiles: { type: 'vector', url: 'https://example.com/tiles.json' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
    { id: 'highway_path', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: ['all', isLine, ['==', ['get', 'class'], 'path']] },
    { id: 'highway_minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: ['all', isLine, ['==', ['get', 'class'], 'minor']] },
    { id: 'highway_major_inner', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: ['all', isLine, ['==', ['get', 'class'], 'primary']] },
    { id: 'railway', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'rail'] },
    { id: 'highway-name-path', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'] } },
    { id: 'place-city', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'] } },
  ],
} as unknown as StyleSpecification;

describe('themeMapStyle', () => {
  const themed = themeMapStyle(baseStyle);
  const ids = themed.layers.map((l) => l.id);

  it('produces a valid MapLibre style', () => {
    expect(validateStyleMin(themed)).toEqual([]);
  });

  it('replaces generic roads with car roads, keeping their place in the stack', () => {
    expect(ids).toEqual([
      'background',
      'pr-road-tunnel',
      'pr-road-casing',
      'pr-road',
      'pr-road-oneway',
      'railway',
      'place-city',
    ]);
  });

  it('drops footpaths and their labels', () => {
    expect(ids).not.toContain('highway_path');
    expect(ids).not.toContain('highway-name-path');
  });
});

describe('parking label layers', () => {
  it.each([
    { free: true, accessible: false, ev: false },
    { free: true, accessible: true, ev: true },
    { free: false, accessible: true, ev: false },
    { free: false, accessible: true, ev: true },
    { free: false, accessible: false, ev: false },
  ])('are valid for %o', async (show) => {
    const { parkingLabels } = await import('./layers');
    const style = {
      ...baseStyle,
      sources: { ...baseStyle.sources, 'parking-labels': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
      layers: [{ ...parkingLabels(show, 'Closed').layer, source: 'parking-labels' }],
    } as unknown as StyleSpecification;
    expect(validateStyleMin(style)).toEqual([]);
  });
});

describe('parking layers', () => {
  it.each(['auto', 'zones', 'heat', 'off'] as const)('are valid in %s mode', async (mode) => {
    const { parkingLayers, selectedOutline } = await import('./layers');
    const layers = parkingLayers(mode, false);
    const geojson = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } };
    const style = {
      ...baseStyle,
      sources: { ...baseStyle.sources, points: geojson, hexes: geojson },
      layers: [
        { ...layers.heat, source: 'points' },
        { ...layers.hexFill, source: 'hexes' },
        { ...layers.outline, source: 'hexes' },
        { ...layers.dots, source: 'points' },
        { ...selectedOutline, source: 'hexes' },
      ],
    } as unknown as StyleSpecification;
    expect(validateStyleMin(style)).toEqual([]);
  });

  it('auto mode shows both, cross-faded by zoom', async () => {
    const { parkingLayers } = await import('./layers');
    const auto = parkingLayers('auto', false);
    expect(auto.showHeat && auto.showHexes).toBe(true);
    const off = parkingLayers('off', false);
    expect(off.showHeat || off.showHexes).toBe(false);
  });
});
