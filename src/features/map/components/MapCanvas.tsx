import 'maplibre-gl/dist/maplibre-gl.css';
import '../lib/maplibreWorker';
import { useIonRouter } from '@ionic/react';
import type { FeatureCollection } from 'geojson';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Source, type LayerProps, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { useLocation } from 'react-router-dom';
import type { ParkingPoint } from '@/api/types';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { useActiveRoute } from '@/features/navigation/hooks';
import { useNavigationStore } from '@/features/navigation/navigationStore';
import { useTripStore } from '@/features/navigation/tripStore';
import { useVisibleParking } from '@/features/parking/hooks';
import { useReports } from '@/features/reports/hooks';
import { nearestOf } from '@/features/parking/lib/hexIndex';
import { useT } from '@/shared/i18n';
import { paths, screenFor } from '@/shared/navigation/paths';
import { useMapStyle } from '../hooks/useMapStyle';
import { MAP_ID, OVERVIEW_ZOOM } from '../hooks/useMapCamera';
import { hexesToFeatures, lineOf, outlineToFeature, pointsToFeatures, reportsToFeatures, reportsToPoints } from '../lib/geojson';
import {
  DOT_LAYER_ID,
  HEX_FILL_LAYER_ID,
  PARKING_LABEL_LAYER_ID,
  parkingLabels,
  parkingLayers,
  REPORT_FILL_LAYER_ID,
  REPORT_LABEL_LAYER_ID,
  reportFill,
  reportLabels,
  reportOutline,
  routeCasing,
  routeLine,
  selectedOutline,
  withVisibility,
} from '../lib/layers';
import { useMapStore } from '../mapStore';
import { HexStates } from './HexStates';
import { trackAttributionHeight } from '../lib/attributionInset';
import { MapImages } from './MapImages';
import { DestinationMarker, UserMarker } from './MapMarkers';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const HEXES_SOURCE = 'parking-hexes';
const POINTS_SOURCE = 'parking-points';

const fromSource = (layer: LayerProps, source: string) => ({ ...layer, source }) as LayerProps;

export function MapCanvas() {
  const router = useIonRouter();
  const screen = screenFor(useLocation().pathname);
  const parkingId = screen.kind === 'parking' || screen.kind === 'navigate' ? screen.parkingId : undefined;
  const navigating = screen.kind === 'navigate' || screen.kind === 'navigateReport';

  const style = useMapStyle();
  const { position } = useUserPosition();
  const heading = useLocationStore((s) => s.heading);
  const layerMode = useMapStore((s) => s.layerMode);
  const labels = useMapStore((s) => s.labels);
  const t = useT();
  const closedLabel = t.common.closed;

  const { byId, geometry, visiblePoints, visibleGeometry } = useVisibleParking();
  const { reports, byId: reportsById } = useReports();
  const navReport = screen.kind === 'navigateReport' ? reportsById.get(screen.reportId) : undefined;
  const selected = parkingId ? byId.get(parkingId) : undefined;
  const { data: route } = useActiveRoute(navigating ? (selected ?? navReport) : undefined);
  const guidanceMarker = useNavigationStore((s) => s.marker);
  const remaining = useNavigationStore((s) => s.remaining);
  const destination = useTripStore((s) => s.destination);
  const showDestination = Boolean(destination) && (screen.kind === 'place' || screen.kind === 'parking' || navigating);
  const [hovering, setHovering] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const onImagesReady = useCallback(() => setImagesReady(true), []);
  const untrackAttribution = useRef<() => void>(undefined);
  useEffect(() => () => untrackAttribution.current?.(), []);

  const hexFeatures = useMemo(() => hexesToFeatures(visibleGeometry.hexes), [visibleGeometry]);
  const outlineFeature = useMemo(() => outlineToFeature(visibleGeometry.outline), [visibleGeometry]);
  const pointFeatures = useMemo(() => pointsToFeatures(visiblePoints), [visiblePoints]);
  const reportHexes = useMemo(() => reportsToFeatures(reports), [reports]);
  const reportPoints = useMemo(() => reportsToPoints(reports), [reports]);
  const selectedFeature = useMemo(
    () => (selected ? hexesToFeatures(geometry.hexes.filter((h) => h.id === selected.id)) : EMPTY),
    [geometry, selected],
  );
  const routeData = useMemo(
    () => (remaining && navigating ? lineOf(remaining) : route ? lineOf(route.geometry) : EMPTY),
    [navigating, remaining, route],
  );

  const layers = useMemo(() => parkingLayers(layerMode, navigating), [layerMode, navigating]);
  const { layer: labelLayer, visible: showLabels } = useMemo(
    () =>
      parkingLabels({
        free: labels.free && !navigating,
        accessible: labels.accessible && !navigating,
        ev: labels.ev && !navigating,
      }, closedLabel),
    [closedLabel, labels.accessible, labels.ev, labels.free, navigating],
  );

  const interactiveLayerIds = [
    ...(layers.showHexes ? [HEX_FILL_LAYER_ID, DOT_LAYER_ID] : []),
    ...(showLabels && imagesReady ? [PARKING_LABEL_LAYER_ID] : []),
    ...(navigating ? [] : [REPORT_FILL_LAYER_ID, ...(imagesReady ? [REPORT_LABEL_LAYER_ID] : [])]),
  ];

  const openReport = useCallback(
    (id: string) => {
      if (screen.kind === 'report' && screen.reportId === id) return;
      router.push(paths.report(id), 'forward', screen.kind === 'report' || screen.kind === 'parking' ? 'replace' : 'push');
    },
    [router, screen],
  );

  const openParking = useCallback(
    (id: string) => {
      if (screen.kind === 'parking' && screen.parkingId === id) return;
      router.push(paths.parking(id), 'forward', screen.kind === 'parking' || screen.kind === 'report' ? 'replace' : 'push');
    },
    [router, screen],
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (screen.kind !== 'home' && screen.kind !== 'parking' && screen.kind !== 'report') return;
      const features = event.features ?? [];
      const top = features[0];
      if (!top) return;
      if (top.layer.id === REPORT_FILL_LAYER_ID || top.layer.id === REPORT_LABEL_LAYER_ID) {
        openReport(String(top.properties?.id));
        return;
      }
      if (top.layer.id !== HEX_FILL_LAYER_ID && typeof top.properties?.id === 'string') {
        openParking(top.properties.id);
        return;
      }
      const candidates = features
        .map((f) => byId.get(String(f.properties?.id)))
        .filter((p): p is ParkingPoint => Boolean(p));
      const point = nearestOf(candidates, { lat: event.lngLat.lat, lng: event.lngLat.lng });
      if (point) openParking(point.id);
    },
    [byId, openParking, openReport, screen.kind],
  );

  return (
    <div className="pr-map-host" role="region" aria-label={t.map.label}>
      {style && (
        <Map
          id={MAP_ID}
          initialViewState={{ longitude: position.lng, latitude: position.lat, zoom: OVERVIEW_ZOOM }}
          mapStyle={style}
          style={{ position: 'absolute', inset: 0 }}
          interactiveLayerIds={interactiveLayerIds}
          onClick={onClick}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          cursor={hovering ? 'pointer' : 'grab'}
          attributionControl={{ compact: true }}
          onLoad={(event) => {
            untrackAttribution.current?.();
            untrackAttribution.current = trackAttributionHeight(event.target.getContainer());
          }}
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
          maxPitch={0}
          minZoom={11}
          maxZoom={19}
          reuseMaps
        >
          <Source id={POINTS_SOURCE} type="geojson" data={pointFeatures}>
            <Layer {...layers.heat} />
          </Source>
          <Source id={HEXES_SOURCE} type="geojson" data={hexFeatures} promoteId="id">
            <Layer {...layers.hexFill} />
          </Source>
          <HexStates sourceId={HEXES_SOURCE} points={visiblePoints} />
          <Source id="parking-outline" type="geojson" data={outlineFeature}>
            <Layer {...layers.outline} />
          </Source>
          <Source id="selected-hex" type="geojson" data={selectedFeature}>
            <Layer {...selectedOutline} />
          </Source>
          <Source id="route" type="geojson" data={routeData}>
            <Layer {...routeCasing} />
            <Layer {...routeLine} />
          </Source>
          <Source id="reports" type="geojson" data={reportHexes}>
            <Layer {...withVisibility(reportFill, !navigating)} />
            <Layer {...withVisibility(reportOutline, !navigating)} />
          </Source>
          <Layer {...fromSource(layers.dots, POINTS_SOURCE)} />
          <MapImages onReady={onImagesReady} />
          {imagesReady && <Layer {...fromSource(labelLayer, POINTS_SOURCE)} />}
          <Source id="report-points" type="geojson" data={reportPoints}>
            {imagesReady && <Layer {...withVisibility(reportLabels, !navigating)} />}
          </Source>

          {showDestination && destination && <DestinationMarker position={destination.location} name={destination.name} />}
          <UserMarker
            position={navigating && guidanceMarker ? guidanceMarker.position : position}
            heading={navigating && guidanceMarker ? guidanceMarker.bearing : heading}
            navigating={navigating}
          />
        </Map>
      )}
    </div>
  );
}
