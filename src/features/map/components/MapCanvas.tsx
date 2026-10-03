import 'maplibre-gl/dist/maplibre-gl.css';
import '../lib/maplibreWorker';
import { useIonRouter } from '@ionic/react';
import type { FeatureCollection } from 'geojson';
import { useCallback, useMemo, useState } from 'react';
import Map, { Layer, Source, type LayerProps, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { useLocation } from 'react-router-dom';
import type { ParkingPoint } from '@/api/types';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { useActiveRoute } from '@/features/navigation/hooks';
import { useNavigationStore } from '@/features/navigation/navigationStore';
import { useParking } from '@/features/parking/hooks';
import { nearestOf } from '@/features/parking/lib/hexIndex';
import { paths, screenFor } from '@/shared/navigation/paths';
import { useMapStyle } from '../hooks/useMapStyle';
import { MAP_ID, OVERVIEW_ZOOM } from '../hooks/useMapCamera';
import { hexesToFeatures, lineOf, outlineToFeature, pointsToFeatures } from '../lib/geojson';
import {
  DOT_LAYER_ID,
  HEX_FILL_LAYER_ID,
  PARKING_LABEL_LAYER_ID,
  parkingLabels,
  parkingLayers,
  routeCasing,
  routeLine,
  selectedOutline,
} from '../lib/layers';
import { useMapStore } from '../mapStore';
import { HexStates } from './HexStates';
import { MapImages } from './MapImages';
import { UserMarker } from './MapMarkers';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const HEXES_SOURCE = 'parking-hexes';
const POINTS_SOURCE = 'parking-points';

const fromSource = (layer: LayerProps, source: string) => ({ ...layer, source }) as LayerProps;

export function MapCanvas() {
  const router = useIonRouter();
  const screen = screenFor(useLocation().pathname);
  const parkingId = screen.kind === 'parking' || screen.kind === 'navigate' ? screen.parkingId : undefined;
  const navigating = screen.kind === 'navigate';

  const style = useMapStyle();
  const { position } = useUserPosition();
  const heading = useLocationStore((s) => s.heading);
  const layerMode = useMapStore((s) => s.layerMode);
  const labels = useMapStore((s) => s.labels);

  const { points, byId, geometry } = useParking();
  const selected = parkingId ? byId.get(parkingId) : undefined;
  const { data: route } = useActiveRoute(navigating ? selected : undefined);
  const guidanceMarker = useNavigationStore((s) => s.marker);
  const remaining = useNavigationStore((s) => s.remaining);
  const [hovering, setHovering] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const onImagesReady = useCallback(() => setImagesReady(true), []);

  const hexFeatures = useMemo(() => hexesToFeatures(geometry.hexes), [geometry]);
  const outlineFeature = useMemo(() => outlineToFeature(geometry.outline), [geometry]);
  const pointFeatures = useMemo(() => pointsToFeatures(points), [points]);
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
      }),
    [labels.accessible, labels.ev, labels.free, navigating],
  );

  const interactiveLayerIds = [
    ...(layers.showHexes ? [HEX_FILL_LAYER_ID, DOT_LAYER_ID] : []),
    ...(showLabels && imagesReady ? [PARKING_LABEL_LAYER_ID] : []),
  ];

  const openParking = useCallback(
    (id: string) => {
      if (screen.kind === 'parking' && screen.parkingId === id) return;
      router.push(paths.parking(id), 'forward', screen.kind === 'parking' ? 'replace' : 'push');
    },
    [router, screen],
  );

  const onClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (screen.kind !== 'home' && screen.kind !== 'parking') return;
      const features = event.features ?? [];
      const top = features[0];
      if (!top) return;
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
    [byId, openParking, screen.kind],
  );

  return (
    <div className="pr-map-host">
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
          <HexStates sourceId={HEXES_SOURCE} points={points} />
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
          <Layer {...fromSource(layers.dots, POINTS_SOURCE)} />
          <MapImages onReady={onImagesReady} />
          {imagesReady && <Layer {...fromSource(labelLayer, POINTS_SOURCE)} />}

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
