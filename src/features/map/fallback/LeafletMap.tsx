import 'leaflet/dist/leaflet.css';
import { useIonRouter } from '@ionic/react';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { LatLng, ParkingPoint } from '@/api/types';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { useActiveRoute } from '@/features/navigation/hooks';
import { useNavigationStore } from '@/features/navigation/navigationStore';
import { useParking } from '@/features/parking/hooks';
import { pointLevel, type AvailabilityLevel } from '@/features/parking/lib/availability';
import { HEX_RADIUS_M, nearestOf } from '@/features/parking/lib/hexIndex';
import { distanceMeters } from '@/shared/lib/geo';
import { paths, screenFor } from '@/shared/navigation/paths';
import { useCameraStore } from '../cameraStore';
import { OVERLAY_PADDING, OVERVIEW_ZOOM } from '../hooks/useMapCamera';
import { heatWeight } from '../lib/geojson';
import { AUTO_HEAT_UNTIL, AUTO_HEXES_FROM, HEAT_RADIUS_M } from '../lib/layers';
import { MAP_COLORS } from '../lib/mapTheme';
import { useMapStore } from '../mapStore';
import styles from './LeafletMap.module.css';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const LABELS_FROM_ZOOM = 14.5;
const MAX_LABELS = 250;

const toLeaflet = (zoom: number) => zoom + 1;
const fromLeaflet = (zoom: number) => zoom - 1;
const latLng = (p: LatLng): L.LatLngTuple => [p.lat, p.lng];

const FILL: Record<AvailabilityLevel, { color: string; opacity: number }> = {
  many: { color: MAP_COLORS.primary, opacity: 0.36 },
  some: { color: MAP_COLORS.primary, opacity: 0.22 },
  few: { color: MAP_COLORS.primary, opacity: 0.12 },
  full: { color: MAP_COLORS.danger, opacity: 0.1 },
};

const levelOf = (p: ParkingPoint): AvailabilityLevel => (p.active ? pointLevel(p) : 'full');

const ICON_P = `<span class="${styles.p}">P</span>`;
const ICON_EV = `<svg width="13" height="13" viewBox="0 0 24 24" fill="${MAP_COLORS.primary}"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>`;
const ICON_ACCESSIBLE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${MAP_COLORS.primary}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4.5" r="1.6" fill="${MAP_COLORS.primary}"/><path d="M11 8v5h5l2.5 5M11 10.5h4M8.2 11.5a5.5 5.5 0 1 0 7.3 7.3"/></svg>`;

function labelRows(p: ParkingPoint, show: { free: boolean; accessible: boolean; ev: boolean }) {
  const rows: string[] = [];
  if (show.free) {
    const text = p.active ? String(p.free) : 'Closed';
    rows.push(`<span class="${styles.row}">${ICON_P}<b class="${p.free > 0 ? '' : styles.full}">${text}</b></span>`);
  }
  if (show.ev && p.evChargingSpaces > 0) rows.push(`<span class="${styles.row}">${ICON_EV}<b>${p.evChargingSpaces}</b></span>`);
  if (show.accessible && p.accessibleSpaces > 0) rows.push(`<span class="${styles.row}">${ICON_ACCESSIBLE}<b>${p.accessibleSpaces}</b></span>`);
  return rows;
}

function userIcon(navigating: boolean, heading: number | null) {
  const html = navigating
    ? `<svg width="56" height="56" viewBox="0 0 56 56" style="transform: rotate(${heading ?? 0}deg)"><circle cx="28" cy="28" r="26" fill="${MAP_COLORS.primary}" fill-opacity=".18"/><path d="M28 12 L40 40 L28 34 L16 40 Z" fill="#fff" stroke="${MAP_COLORS.primary}" stroke-width="2.5" stroke-linejoin="round"/></svg>`
    : `<span class="${styles.you}"><span class="${styles.halo}"></span><span class="${styles.dot}"></span></span>`;
  return L.divIcon({ html, className: styles.icon, iconSize: navigating ? [56, 56] : [44, 44] });
}

export default function LeafletMap() {
  const router = useIonRouter();
  const screen = screenFor(useLocation().pathname);
  const parkingId = screen.kind === 'parking' || screen.kind === 'navigate' ? screen.parkingId : undefined;
  const navigating = screen.kind === 'navigate';

  const { position } = useUserPosition();
  const heading = useLocationStore((s) => s.heading);
  const layerMode = useMapStore((s) => s.layerMode);
  const labels = useMapStore((s) => s.labels);
  const setFallback = useCameraStore((s) => s.setFallback);
  const { points, byId, geometry } = useParking();
  const selected = parkingId ? byId.get(parkingId) : undefined;
  const { data: route } = useActiveRoute(navigating ? selected : undefined);
  const guidanceMarker = useNavigationStore((s) => s.marker);
  const remaining = useNavigationStore((s) => s.remaining);

  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [view, setView] = useState({ zoom: OVERVIEW_ZOOM, version: 0 });
  const initial = useRef(position);
  const openRef = useRef<(id: string) => void>(() => undefined);

  openRef.current = (id: string) => {
    if (screen.kind !== 'home' && screen.kind !== 'parking') return;
    if (screen.kind === 'parking' && screen.parkingId === id) return;
    router.push(paths.parking(id), 'forward', screen.kind === 'parking' ? 'replace' : 'push');
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const instance = L.map(el, {
      zoomControl: false,
      preferCanvas: true,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      minZoom: 12,
      maxZoom: 20,
    }).setView(latLng(initial.current), toLeaflet(OVERVIEW_ZOOM));
    instance.attributionControl.setPrefix(false);
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 20, maxNativeZoom: 19, className: styles.tiles }).addTo(instance);
    const onView = () => setView((v) => ({ zoom: fromLeaflet(instance.getZoom()), version: v.version + 1 }));
    instance.on('zoomend moveend', onView);
    setMap(instance);
    return () => {
      instance.off('zoomend moveend', onView);
      instance.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    setFallback({
      ready: true,
      flyTo(center, zoom = OVERVIEW_ZOOM) {
        map.flyTo(latLng(center), toLeaflet(zoom), { duration: 0.9 });
        return true;
      },
      fitTo(pts, padding = OVERLAY_PADDING, maxZoom = 16.5) {
        if (pts.length === 0) return false;
        map.flyToBounds(L.latLngBounds(pts.map(latLng)), {
          paddingTopLeft: [padding.left, padding.top],
          paddingBottomRight: [padding.right, padding.bottom],
          maxZoom: toLeaflet(maxZoom),
          duration: 0.9,
        });
        return true;
      },
      follow(center) {
        const zoom = Math.max(map.getZoom(), toLeaflet(16));
        const target = map.unproject(map.project(latLng(center), zoom).subtract([0, 50]), zoom);
        map.setView(target, zoom, { animate: true, duration: 0.8 } as L.ZoomPanOptions);
      },
      resetNorth() {},
    });
    return () => setFallback(null);
  }, [map, setFallback]);

  const autoHeat = layerMode === 'auto' && view.zoom < (AUTO_HEAT_UNTIL + AUTO_HEXES_FROM) / 2;
  const showHexes = !navigating && (layerMode === 'zones' || (layerMode === 'auto' && !autoHeat));
  const showHeat = !navigating && (layerMode === 'heat' || autoHeat);

  const hexLayer = useMemo(() => L.layerGroup(), []);
  const hexPolygons = useRef(new Map<string, L.Polygon>());
  const outlineLayer = useMemo(() => L.layerGroup(), []);
  const dotLayer = useMemo(() => L.layerGroup(), []);
  const heatLayer = useMemo(() => L.layerGroup(), []);
  const labelLayer = useMemo(() => L.layerGroup(), []);
  const selectedLayer = useMemo(() => L.layerGroup(), []);
  const routeLayer = useMemo(() => L.layerGroup(), []);

  useEffect(() => {
    if (!map) return;
    for (const layer of [heatLayer, hexLayer, outlineLayer, selectedLayer, routeLayer, dotLayer, labelLayer]) layer.addTo(map);
    return () => {
      for (const layer of [heatLayer, hexLayer, outlineLayer, selectedLayer, routeLayer, dotLayer, labelLayer]) layer.remove();
    };
  }, [map, heatLayer, hexLayer, outlineLayer, selectedLayer, routeLayer, dotLayer, labelLayer]);

  useEffect(() => {
    hexLayer.clearLayers();
    outlineLayer.clearLayers();
    hexPolygons.current.clear();
    for (const hex of geometry.hexes) {
      const polygon = L.polygon(hex.ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple), { stroke: false, fillOpacity: 0 });
      polygon.on('click', (event: L.LeafletMouseEvent) => {
        const at = { lat: event.latlng.lat, lng: event.latlng.lng };
        const hits = points.filter((p) => distanceMeters(at, p) <= HEX_RADIUS_M * 1.15);
        const target = nearestOf(hits.length ? hits : points, at);
        if (target) openRef.current(target.id);
      });
      polygon.addTo(hexLayer);
      hexPolygons.current.set(hex.id, polygon);
    }
    if (geometry.outline.length) {
      L.geoJSON({ type: 'MultiPolygon', coordinates: geometry.outline } as GeoJSON.MultiPolygon, {
        style: { color: MAP_COLORS.primary, weight: 1.5, opacity: 0.5, fill: false },
        interactive: false,
      }).addTo(outlineLayer);
    }
  }, [geometry, hexLayer, outlineLayer, points]);

  useEffect(() => {
    for (const point of points) {
      const { color, opacity } = FILL[levelOf(point)];
      hexPolygons.current.get(point.id)?.setStyle({ fillColor: color, fillOpacity: showHexes ? opacity : 0 });
    }
    outlineLayer.eachLayer((layer) => (layer as L.Path).setStyle?.({ opacity: showHexes ? 0.5 : 0 }));

    dotLayer.clearLayers();
    heatLayer.clearLayers();
    for (const point of points) {
      if (showHexes) {
        L.circleMarker(latLng(point), {
          radius: 4.5,
          color: '#FFFFFF',
          weight: 1.5,
          fillColor: point.active ? MAP_COLORS.primary : MAP_COLORS.danger,
          fillOpacity: 1,
        })
          .on('click', () => openRef.current(point.id))
          .addTo(dotLayer);
      }
      const weight = heatWeight(point);
      if (showHeat && weight > 0) {
        L.circle(latLng(point), { radius: HEAT_RADIUS_M, stroke: false, fillColor: MAP_COLORS.primary, fillOpacity: 0.07 + weight * 0.18, interactive: false }).addTo(heatLayer);
      }
    }
  }, [points, showHexes, showHeat, dotLayer, heatLayer, outlineLayer]);

  useEffect(() => {
    labelLayer.clearLayers();
    if (!map || navigating || view.zoom < LABELS_FROM_ZOOM) return;
    const show = { free: labels.free, accessible: labels.accessible, ev: labels.ev };
    if (!show.free && !show.accessible && !show.ev) return;

    const bounds = map.getBounds().pad(0.1);
    const placed: L.Bounds[] = [];
    const visible = points
      .filter((p) => bounds.contains(latLng(p)))
      .sort((a, b) => b.free - a.free)
      .slice(0, MAX_LABELS * 2);

    for (const point of visible) {
      const rows = labelRows(point, show);
      if (rows.length === 0) continue;
      const height = rows.length * 18 + 8;
      const anchor = map.latLngToContainerPoint(latLng(point));
      const box = L.bounds([anchor.x - 30, anchor.y - height - 12], [anchor.x + 30, anchor.y - 10]);
      if (placed.some((b) => b.intersects(box))) continue;
      placed.push(box);
      L.marker(latLng(point), {
        icon: L.divIcon({ html: `<div class="${styles.pill}">${rows.join('')}</div>`, className: styles.label, iconSize: [0, 0] }),
        keyboard: false,
      })
        .on('click', () => openRef.current(point.id))
        .addTo(labelLayer);
      if (placed.length >= MAX_LABELS) break;
    }
  }, [map, points, labels.free, labels.accessible, labels.ev, navigating, view, labelLayer]);

  useEffect(() => {
    selectedLayer.clearLayers();
    const hex = selected && geometry.hexes.find((h) => h.id === selected.id);
    if (hex) {
      L.polygon(hex.ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple), {
        color: MAP_COLORS.primary,
        weight: 3.5,
        fill: false,
        interactive: false,
      }).addTo(selectedLayer);
    }
  }, [selected, geometry, selectedLayer]);

  useEffect(() => {
    routeLayer.clearLayers();
    const line = remaining && navigating ? remaining : route?.geometry;
    if (!line?.length) return;
    const latlngs = line.map(latLng);
    L.polyline(latlngs, { color: '#FFFFFF', weight: 12, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(routeLayer);
    L.polyline(latlngs, { color: MAP_COLORS.primary, weight: 7, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(routeLayer);
  }, [route, remaining, navigating, routeLayer]);

  const userMarker = useRef<L.Marker | null>(null);
  const markerPosition = navigating && guidanceMarker ? guidanceMarker.position : position;
  const markerHeading = navigating && guidanceMarker ? guidanceMarker.bearing : heading;

  useEffect(() => {
    if (!map) return;
    if (!userMarker.current) {
      userMarker.current = L.marker(latLng(markerPosition), { interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map);
    }
    userMarker.current.setLatLng(latLng(markerPosition));
    userMarker.current.setIcon(userIcon(navigating, markerHeading));
  }, [map, markerPosition, markerHeading, navigating]);

  useEffect(
    () => () => {
      userMarker.current?.remove();
      userMarker.current = null;
    },
    [],
  );

  return (
    <div className="pr-map-host">
      <div ref={containerRef} className={styles.map} />
    </div>
  );
}
