import { useIonRouter, useIonViewWillEnter } from '@ionic/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { LayersSheet } from '@/features/map/components/LayersSheet';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { useTripStore } from '@/features/navigation/tripStore';
import { useParking } from '@/features/parking/hooks';
import { estimateDriveSeconds, recommendParking } from '@/features/parking/lib/recommend';
import { formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { ActionBadge, IconButton, InfoBanner, MapScreen, SearchTrigger } from '@/shared/ui';
import styles from './HomePage.module.css';

export default function HomePage() {
  const router = useIonRouter();
  const camera = useMapCamera();
  const { position, isFallback } = useUserPosition();
  const locationStatus = useLocationStore((s) => s.status);
  const setDestination = useTripStore((s) => s.setDestination);
  const parking = useParking();
  const [layersOpen, setLayersOpen] = useState(false);

  const best = useMemo(() => recommendParking(parking.points, position), [parking.points, position]);

  useIonViewWillEnter(() => {
    setDestination(null);
    camera.resetNorth();
  }, [camera, setDestination]);

  const centered = useRef(false);
  useEffect(() => {
    if (isFallback || centered.current) return;
    centered.current = camera.flyTo(position);
  }, [camera, isFallback, position]);

  const locationOff = locationStatus === 'denied' || locationStatus === 'unavailable';

  return (
    <MapScreen
      top={
        <div className={layersOpen ? styles.hidden : styles.top}>
          <SearchTrigger onClick={() => router.push(paths.search)} />
          {locationOff && (
            <InfoBanner icon="locate">
              {locationStatus === 'denied' ? 'Location is off.' : 'Can’t find your location.'} Showing parking
              around the city centre.
            </InfoBanner>
          )}
        </div>
      }
      side={
        <>
          <IconButton
            icon="layers"
            label="Map layers"
            variant={layersOpen ? 'active' : 'float'}
            pressed={layersOpen}
            onClick={() => setLayersOpen(true)}
          />
          <IconButton
            icon="locate"
            label="Center on my location"
            onClick={() => {
              tapFeedback();
              camera.flyTo(position);
            }}
          />
        </>
      }
      bottom={
        parking.isPending ? (
          <ActionBadge loading title="" icon="arrow" ariaLabel="Finding parking nearby" />
        ) : parking.isError && !parking.data ? (
          <ActionBadge
            title="Can’t load parking"
            subtitle="Tap to try again"
            icon="recent"
            onClick={() => void parking.refetch()}
          />
        ) : best ? (
          <ActionBadge
            title={`${best.free} free nearby`}
            subtitle={`${best.name} · ${formatDuration(estimateDriveSeconds(position, best))}`}
            icon="arrow"
            onClick={() => {
              tapFeedback();
              router.push(paths.parking(best.id));
            }}
          />
        ) : (
          <ActionBadge title="No free spaces nearby" subtitle="Search another area" icon="search" onClick={() => router.push(paths.search)} />
        )
      }
    >
      {layersOpen && <LayersSheet onClose={() => setLayersOpen(false)} />}
    </MapScreen>
  );
}
