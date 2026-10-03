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

export function themeMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map(themeLayer).filter((layer): layer is LayerSpecification => layer !== null),
  };
}

export const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': MAP_COLORS.ground } }],
};
