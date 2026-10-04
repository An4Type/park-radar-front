import { useIonRouter, useIonViewWillEnter } from '@ionic/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import { LocationHelpSheet } from '@/features/location/components/LocationHelpSheet';
import { useUserPosition } from '@/features/location/hooks';
import { geoErrorKind, requestLocationNow } from '@/features/location/services/geolocation';
import { useLocationStore } from '@/features/location/locationStore';
import { FiltersSheet } from '@/features/map/components/FiltersSheet';
import { LayersSheet } from '@/features/map/components/LayersSheet';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { useTripStore } from '@/features/navigation/tripStore';
import { useVisibleParking } from '@/features/parking/hooks';
import { estimateDriveSeconds, recommendParking } from '@/features/parking/lib/recommend';
import { ReportSheet } from '@/features/reports/components/ReportSheet';
import { formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { ActionBadge, IconButton, InfoBanner, MapScreen, SearchTrigger } from '@/shared/ui';
import styles from './HomePage.module.css';

type Sheet = 'layers' | 'filters' | 'report' | 'location-help' | null;

const THANKS_MS = 4_000;

export default function HomePage() {
  const router = useIonRouter();
  const camera = useMapCamera();
  const { position, isFallback } = useUserPosition();
  const locationStatus = useLocationStore((s) => s.status);
  const locationBlocked = useLocationStore((s) => s.blocked);
  const retryLocation = useLocationStore((s) => s.retry);
  const setFix = useLocationStore((s) => s.setFix);
  const setLocationError = useLocationStore((s) => s.setError);
  const [requesting, setRequesting] = useState(false);
  const setDestination = useTripStore((s) => s.setDestination);
  const parking = useVisibleParking();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [thanks, setThanks] = useState(false);

  const best = useMemo(() => recommendParking(parking.visiblePoints, position), [parking.visiblePoints, position]);

  useIonViewWillEnter(() => {
    setDestination(null);
    camera.resetNorth();
  }, [camera, setDestination]);

  const centered = useRef(false);
  const retried = useRef(false);
  useEffect(() => {
    if (isFallback || centered.current) return;
    centered.current = camera.flyTo(position);
  }, [camera, isFallback, position]);

  useEffect(() => {
    if (!thanks) return;
    const timer = window.setTimeout(() => setThanks(false), THANKS_MS);
    return () => window.clearTimeout(timer);
  }, [thanks]);

  const locationOff = locationStatus === 'denied' || locationStatus === 'unavailable';
  const retrying = isFallback && (requesting || (locationStatus === 'locating' && retried.current));

  const askForLocation = () => {
    if (requesting) return;
    retried.current = true;
    centered.current = false;
    setRequesting(true);
    const request = requestLocationNow();
    tapFeedback();
    request
      .then((fix) => {
        setFix(fix);
        setSheet(null);
        retryLocation();
      })
      .catch((error) => {
        const kind = geoErrorKind(error);
        setLocationError(kind, kind === 'denied');
        if (kind === 'denied') setSheet('location-help');
        else retryLocation();
      })
      .finally(() => setRequesting(false));
  };

  const locationBanner = retrying ? (
    <InfoBanner icon="locate">{requesting ? 'Asking for your location…' : 'Finding your location…'}</InfoBanner>
  ) : locationOff ? (
    <InfoBanner
      icon="locate"
      onClick={askForLocation}
      hint={
        locationBlocked
          ? 'Tap to see how to turn it on'
          : locationStatus === 'denied'
            ? 'Tap to turn on location'
            : 'Tap to try again'
      }
    >
      {locationStatus === 'denied' ? 'Location is off.' : 'Can’t find your location.'} Showing parking around{' '}
      {env.defaultCenterName}.
    </InfoBanner>
  ) : null;

  const action = parking.isPending ? (
    <ActionBadge loading title="" icon="arrow" ariaLabel="Finding parking nearby" />
  ) : parking.isError && !parking.data ? (
    <ActionBadge title="Can’t load parking" subtitle="Tap to try again" icon="recent" onClick={() => void parking.refetch()} />
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
  ) : parking.filtered ? (
    <ActionBadge title="No parking matches filters" subtitle="Change filters" icon="filter" onClick={() => setSheet('filters')} />
  ) : (
    <ActionBadge title="No free spaces nearby" subtitle="Search another area" icon="search" onClick={() => router.push(paths.search)} />
  );

  return (
    <MapScreen
      top={
        <div className={sheet ? styles.hidden : styles.top}>
          <SearchTrigger onClick={() => router.push(paths.search)} />
          {thanks && (
            <InfoBanner icon="check">
              <b>Thanks!</b> Your report is on the map for other drivers.
            </InfoBanner>
          )}
          {!thanks && locationBanner}
        </div>
      }
      side={
        <>
          <IconButton
            icon="layers"
            label="Map layers"
            variant={sheet === 'layers' ? 'active' : 'float'}
            pressed={sheet === 'layers'}
            onClick={() => setSheet('layers')}
          />
          <IconButton
            icon="filter"
            label={parking.filtered ? 'Filters, some active' : 'Filters'}
            variant={sheet === 'filters' ? 'active' : 'float'}
            pressed={sheet === 'filters'}
            badge={parking.filtered}
            onClick={() => setSheet('filters')}
          />
          <IconButton
            icon="locate"
            label="Center on my location"
            onClick={() => {
              if (isFallback) return askForLocation();
              tapFeedback();
              camera.flyTo(position);
            }}
          />
        </>
      }
      bottom={
        <div className={styles.bottomRow}>
          <div className={styles.action}>{action}</div>
          <IconButton
            icon="report"
            label="Report free parking here"
            variant="large"
            onClick={() => {
              tapFeedback();
              setSheet('report');
            }}
          />
        </div>
      }
    >
      {sheet === 'layers' && <LayersSheet onClose={() => setSheet(null)} />}
      {sheet === 'filters' && <FiltersSheet onClose={() => setSheet(null)} />}
      {sheet === 'location-help' && <LocationHelpSheet onRetry={askForLocation} onClose={() => setSheet(null)} />}
      {sheet === 'report' && (
        <ReportSheet
          location={isFallback ? null : position}
          onClose={() => setSheet(null)}
          onSent={() => {
            setSheet(null);
            setThanks(true);
          }}
        />
      )}
    </MapScreen>
  );
}
