import { useIonRouter, useIonViewWillEnter } from '@ionic/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/config/env';
import { LanguageButton } from '@/features/language/components/LanguageButton';
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
import { ParkingListSheet } from '@/features/parking/components/ParkingListSheet';
import { ReportSheet } from '@/features/reports/components/ReportSheet';
import { useT } from '@/shared/i18n';
import { formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { ActionBadge, IconButton, InfoBanner, MapScreen, SearchTrigger } from '@/shared/ui';
import styles from './HomePage.module.css';

type Sheet = 'list' | 'layers' | 'filters' | 'report' | 'location-help' | null;

const THANKS_MS = 4_000;

export default function HomePage() {
  const router = useIonRouter();
  const camera = useMapCamera();
  const t = useT();
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
    <InfoBanner icon="locate">{requesting ? t.home.askingLocation : t.home.findingLocation}</InfoBanner>
  ) : locationOff ? (
    <InfoBanner
      icon="locate"
      onClick={askForLocation}
      hint={
        locationBlocked
          ? t.home.hintBlocked
          : locationStatus === 'denied'
            ? t.home.hintDenied
            : t.home.hintRetry
      }
    >
      {locationStatus === 'denied' ? t.home.locationOff : t.home.locationUnavailable} {t.home.showingAround(env.defaultCenterName)}
    </InfoBanner>
  ) : null;

  const action = parking.isPending ? (
    <ActionBadge loading title="" icon="arrow" ariaLabel={t.home.findingParking} />
  ) : parking.isError && !parking.data ? (
    <ActionBadge title={t.home.cantLoadParking} subtitle={t.home.hintRetry} icon="recent" onClick={() => void parking.refetch()} />
  ) : best ? (
    <ActionBadge
      title={t.home.freeNearby(best.free)}
      subtitle={`${best.name} · ${formatDuration(estimateDriveSeconds(position, best))}`}
      icon="arrow"
      onClick={() => {
        tapFeedback();
        router.push(paths.parking(best.id));
      }}
    />
  ) : parking.filtered ? (
    <ActionBadge title={t.home.noMatchFilters} subtitle={t.home.changeFilters} icon="filter" onClick={() => setSheet('filters')} />
  ) : (
    <ActionBadge title={t.home.noFreeNearby} subtitle={t.home.searchAnotherArea} icon="search" onClick={() => router.push(paths.search)} />
  );

  return (
    <MapScreen
      title={t.titles.home}
      heading={t.titles.home}
      inert={Boolean(sheet)}
      top={
        <div className={sheet ? styles.hidden : styles.top}>
          <div className={styles.searchRow}>
            <SearchTrigger className={styles.search} onClick={() => router.push(paths.search)} />
            <LanguageButton />
          </div>
          {thanks && (
            <InfoBanner icon="check">
              <b>{t.home.thanksTitle}</b> {t.home.thanksBody}
            </InfoBanner>
          )}
          {!thanks && locationBanner}
        </div>
      }
      side={
        <>
          <IconButton
            icon="list"
            label={t.home.list}
            variant={sheet === 'list' ? 'active' : 'float'}
            pressed={sheet === 'list'}
            onClick={() => setSheet('list')}
          />
          <IconButton
            icon="layers"
            label={t.home.mapLayers}
            variant={sheet === 'layers' ? 'active' : 'float'}
            pressed={sheet === 'layers'}
            onClick={() => setSheet('layers')}
          />
          <IconButton
            icon="filter"
            label={parking.filtered ? t.home.filtersActive : t.home.filters}
            variant={sheet === 'filters' ? 'active' : 'float'}
            pressed={sheet === 'filters'}
            badge={parking.filtered}
            onClick={() => setSheet('filters')}
          />
          <IconButton
            icon="locate"
            label={t.home.centerOnMe}
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
            label={t.home.reportHere}
            variant="large"
            onClick={() => {
              tapFeedback();
              setSheet('report');
            }}
          />
        </div>
      }
    >
      {sheet === 'list' && <ParkingListSheet position={position} onClose={() => setSheet(null)} />}
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
