import 'maplibre-gl/dist/maplibre-gl.css';
import '../lib/maplibreWorker';
import { useIonRouter } from '@ionic/react';
import type { FeatureCollection } from 'geojson';
import { useCallback, useMemo, useState } from 'react';
import Map, { Layer, Source, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { useLocation } from 'react-router-dom';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { useActiveRoute } from '@/features/navigation/hooks';
import { useParking } from '@/features/parking/hooks';
import { cellOf, pickInCell } from '@/features/parking/lib/cellIndex';
import { recommendParking } from '@/features/parking/lib/recommend';
import { paths, screenFor } from '@/shared/navigation/paths';
import { useMapStyle } from '../hooks/useMapStyle';
import { MAP_ID, OVERVIEW_ZOOM } from '../hooks/useMapCamera';
import { cellsToFeatures, clustersToFeatures, pointsToHeat, routeToLine } from '../lib/geojson';
import {
  CELL_FILL_LAYER_ID,
  cellFill,
  clusterOutline,
  routeCasing,
  routeLine,
  selectedOutline,
  softHeat,
  visibility,
} from '../lib/layers';
import { useMapStore } from '../mapStore';
import { CellStates } from './CellStates';
import { CountBadge, UserMarker } from './MapMarkers';

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const CELLS_SOURCE = 'cells';

export function MapCanvas() {
  const router = useIonRouter();
  const screen = screenFor(useLocation().pathname);
  const parkingId = screen.kind === 'parking' || screen.kind === 'navigate' ? screen.parkingId : undefined;
  const navigating = screen.kind === 'navigate';

  const style = useMapStyle();
  const { position } = useUserPosition();
  const heading = useLocationStore((s) => s.heading);
  const layerMode = useMapStore((s) => s.layerMode);

  const parking = useParking();
  const { points, byId, byCell, geometry } = parking;
  const selected = parkingId ? byId.get(parkingId) : undefined;
  const { data: route } = useActiveRoute(navigating ? selected : undefined);
  const [hovering, setHovering] = useState(false);

  const cellFeatures = useMemo(() => cellsToFeatures(geometry.cells), [geometry]);
  const clusterFeatures = useMemo(() => clustersToFeatures(geometry.clusters), [geometry]);
  const heat = useMemo(() => pointsToHeat(points), [points]);
  const selectedCell = selected ? cellOf(selected) : undefined;
  const selectedFeature = useMemo(
    () => (selectedCell ? cellsToFeatures(geometry.cells.filter((c) => c.id === selectedCell)) : EMPTY),
    [geometry, selectedCell],
  );
  const routeData = useMemo(() => (route ? routeToLine(route) : EMPTY), [route]);
  const recommended = useMemo(() => recommendParking(points, position), [points, position]);

  const badgePoint = screen.kind === 'home' ? recommended : selected;
  const showCells = layerMode === 'zones' && !navigating;
  const showHeat = layerMode === 'heat' && !navigating;

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
      const cell = event.features?.[0]?.properties?.id;
      if (typeof cell !== 'string') return;
      const point = pickInCell(parking, cell, { lat: event.lngLat.lat, lng: event.lngLat.lng });
      if (point) openParking(point.id);
    },
    [openParking, parking, screen.kind],
  );

  return (
    <div className="pr-map-host">
      {style && (
        <Map
          id={MAP_ID}
          initialViewState={{ longitude: position.lng, latitude: position.lat, zoom: OVERVIEW_ZOOM }}
          mapStyle={style}
          style={{ position: 'absolute', inset: 0 }}
          interactiveLayerIds={showCells ? [CELL_FILL_LAYER_ID] : []}
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
          <Source id={CELLS_SOURCE} type="geojson" data={cellFeatures} promoteId="id">
            <Layer {...cellFill} layout={{ visibility: visibility(showCells) }} />
          </Source>
          <CellStates sourceId={CELLS_SOURCE} byCell={byCell} />
          <Source id="clusters" type="geojson" data={clusterFeatures}>
            <Layer {...clusterOutline} layout={{ ...clusterOutline.layout, visibility: visibility(showCells) }} />
          </Source>
          <Source id="parking-heat" type="geojson" data={heat}>
            <Layer {...softHeat} layout={{ visibility: visibility(showHeat) }} />
          </Source>
          <Source id="selected-cell" type="geojson" data={selectedFeature}>
            <Layer {...selectedOutline} />
          </Source>
          <Source id="route" type="geojson" data={routeData}>
            <Layer {...routeCasing} />
            <Layer {...routeLine} />
          </Source>

          {badgePoint && !navigating && (
            <CountBadge
              key={badgePoint.id}
              position={badgePoint}
              free={badgePoint.free}
              onClick={() => openParking(badgePoint.id)}
            />
          )}
          <UserMarker position={position} heading={heading} navigating={navigating} />
        </Map>
      )}
    </div>
  );
}
