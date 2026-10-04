import type { Map as MapLibreMap } from 'maplibre-gl';
import { MAP_COLORS } from './mapTheme';

const RATIO = 2;
const ICON = 16 * RATIO;

const BOLT = 'M13 3L5 14h6l-1 7 8-11h-6z';
const REPORT = 'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-5 4v-4.2A1.5 1.5 0 0 1 4 14.5z';
const WHEELCHAIR = 'M11 8v5h5l2.5 5M11 10.5h4M8.2 11.5a5.5 5.5 0 1 0 7.3 7.3';

function canvas(width: number, height: number) {
  const el = document.createElement('canvas');
  el.width = width;
  el.height = height;
  return { el, ctx: el.getContext('2d')! };
}

function pill() {
  const w = 48;
  const h = 44;
  const r = 20;
  const { ctx } = canvas(w, h);
  ctx.beginPath();
  ctx.roundRect(1.5, 1.5, w - 3, h - 3, r);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#D5D9DE';
  ctx.stroke();
  return {
    data: ctx.getImageData(0, 0, w, h),
    options: { pixelRatio: RATIO, stretchX: [[20, 28]] as [number, number][], stretchY: [[20, 24]] as [number, number][], content: [12, 7, 36, 37] as [number, number, number, number] },
  };
}

function badgeP() {
  const { ctx } = canvas(ICON, ICON);
  ctx.beginPath();
  ctx.arc(ICON / 2, ICON / 2, ICON / 2, 0, Math.PI * 2);
  ctx.fillStyle = MAP_COLORS.primary;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${11 * RATIO}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', ICON / 2, ICON / 2 + RATIO * 0.5);
  return { data: ctx.getImageData(0, 0, ICON, ICON), options: { pixelRatio: RATIO } };
}

function glyph(path: string, mode: 'fill' | 'stroke') {
  const { ctx } = canvas(ICON, ICON);
  ctx.scale(ICON / 24, ICON / 24);
  const shape = new Path2D(path);
  ctx.strokeStyle = MAP_COLORS.primary;
  ctx.fillStyle = MAP_COLORS.primary;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mode === 'fill') ctx.fill(shape);
  else ctx.stroke(shape);
  if (path === WHEELCHAIR) {
    ctx.beginPath();
    ctx.arc(11, 4.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  return { data: ctx.getImageData(0, 0, ICON, ICON), options: { pixelRatio: RATIO } };
}

const FACTORIES = {
  'pr-pill': pill,
  'pr-p': badgeP,
  'pr-ev': () => glyph(BOLT, 'fill'),
  'pr-accessible': () => glyph(WHEELCHAIR, 'stroke'),
  'pr-report': () => glyph(REPORT, 'stroke'),
} as const;

export type MapImageId = keyof typeof FACTORIES;

export function addMapImage(map: MapLibreMap, id: string): boolean {
  if (!(id in FACTORIES) || map.hasImage(id)) return false;
  const { data, options } = FACTORIES[id as MapImageId]();
  map.addImage(id, data, options);
  return true;
}

export function addAllMapImages(map: MapLibreMap) {
  for (const id of Object.keys(FACTORIES)) addMapImage(map, id);
}
