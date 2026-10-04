import { useIonRouter } from '@ionic/react';
import { useEffect, useMemo, useRef } from 'react';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { useTripStore } from '@/features/navigation/tripStore';
import { AvailabilityTag } from '@/features/parking/components/AvailabilityTag';
import { useVisibleParking } from '@/features/parking/hooks';
import { pointLevel } from '@/features/parking/lib/availability';
import { formatFee } from '@/features/parking/lib/parkingType';
import { useT } from '@/shared/i18n';
import { formatDistance } from '@/shared/lib/format';
import { distanceMeters } from '@/shared/lib/geo';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { useGoBack } from '@/shared/navigation/useGoBack';
import { BottomSheet, Button, Icon, IconButton, List, ListRow, MapScreen, Skeleton } from '@/shared/ui';
import styles from './PlacePage.module.css';

const MAX_RESULTS = 6;
const SHEET_PADDING = { top: 110, bottom: 420, left: 48, right: 48 };

export default function PlacePage() {
  const router = useIonRouter();
  const goBack = useGoBack(paths.search);
  const camera = useMapCamera();
  const t = useT();
  const destination = useTripStore((s) => s.destination);
  const { visiblePoints, isPending, filtered } = useVisibleParking();

  const nearby = useMemo(() => {
    if (!destination) return [];
    return visiblePoints
      .map((point) => ({ point, walk: distanceMeters(destination.location, point) }))
      .sort((a, b) => a.walk - b.walk)
      .slice(0, MAX_RESULTS);
  }, [destination, visiblePoints]);

  const framed = useRef<string>(undefined);
  useEffect(() => {
    if (!destination || nearby.length === 0) return;
    const key = `${destination.location.lat},${destination.location.lng}`;
    if (framed.current === key) return;
    const points = [destination.location, ...nearby.slice(0, 3).map((n) => n.point)];
    if (camera.fitTo(points, SHEET_PADDING, 16.5)) framed.current = key;
  }, [camera, destination, nearby]);

  useEffect(() => {
    if (!destination) goBack();
  }, [destination, goBack]);

  if (!destination) return <MapScreen />;

  return (
    <MapScreen
      title={t.place.parkingNearName(destination.name)}
      top={<IconButton icon="back" label={t.place.backToSearch} onClick={goBack} className={styles.back} />}>
      <BottomSheet label={t.place.parkingNearName(destination.name)} onDismiss={goBack}>
        <header className={styles.header}>
          <span className={styles.overline}>
            <Icon name="place" size={14} />
            {t.place.parkingNear}
          </span>
          <h1 className={styles.title} tabIndex={-1}>
            {destination.name}
          </h1>
          {destination.detail && <p className={styles.detail}>{destination.detail}</p>}
        </header>

        {isPending ? (
          <div className={styles.loading} aria-label={t.parking.loading}>
            <Skeleton height={16} width="60%" />
            <Skeleton height={16} width="45%" />
          </div>
        ) : nearby.length === 0 ? (
          <div className={styles.empty}>
            <p>{filtered ? t.place.noMatch : t.place.noData}</p>
            <Button variant="secondary" block onClick={goBack}>
              {t.place.searchElsewhere}
            </Button>
          </div>
        ) : (
          <List label={t.place.nearby}>
            {nearby.map(({ point, walk }) => (
              <ListRow
                key={point.id}
                title={point.name}
                subtitle={[t.common.walk(formatDistance(walk)), point.active ? t.common.free(point.free) : t.common.closed, formatFee(point.paid)]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={<AvailabilityTag level={point.active ? pointLevel(point) : 'full'} />}
                onClick={() => {
                  tapFeedback();
                  router.push(paths.parking(point.id));
                }}
              />
            ))}
          </List>
        )}
      </BottomSheet>
    </MapScreen>
  );
}
