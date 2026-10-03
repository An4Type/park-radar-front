import { useIonRouter } from '@ionic/react';
import { ImpactStyle } from '@capacitor/haptics';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUserPosition } from '@/features/location/hooks';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { useActiveRoute } from '@/features/navigation/hooks';
import { useTripStore } from '@/features/navigation/tripStore';
import { ParkingSummary } from '@/features/parking/components/ParkingSummary';
import { useParkingPoint } from '@/features/parking/hooks';
import { hexPoints } from '@/features/parking/lib/hexIndex';
import { formatDistance, formatDuration, formatUpdatedAgo } from '@/shared/lib/format';
import { distanceMeters } from '@/shared/lib/geo';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { useGoBack } from '@/shared/navigation/useGoBack';
import { ActionBadge, BottomSheet, Button, IconButton, MapScreen, Skeleton } from '@/shared/ui';
import styles from './ParkingPage.module.css';

const SHEET_PADDING = { top: 110, bottom: 320, left: 48, right: 48 };

export default function ParkingPage() {
  const { parkingId } = useParams<{ parkingId: string }>();
  const router = useIonRouter();
  const goBack = useGoBack();
  const camera = useMapCamera();
  const { position } = useUserPosition();
  const destination = useTripStore((s) => s.destination);
  const startNavigation = useTripStore((s) => s.startNavigation);

  const { point, isPending, isError, refetch } = useParkingPoint(parkingId);
  const route = useActiveRoute(point);

  const framed = useRef<string>(undefined);
  useEffect(() => {
    if (!point || framed.current === point.id) return;
    if (camera.fitTo([...hexPoints(point), destination?.location ?? position], SHEET_PADDING)) {
      framed.current = point.id;
    }
  }, [camera, destination, position, point]);

  const detail = point
    ? destination
      ? `${formatDistance(distanceMeters(point, destination.location))} walk`
      : formatUpdatedAgo(point.updatedAt)
    : '';

  return (
    <MapScreen top={<IconButton icon="back" label="Back to map" onClick={goBack} className={styles.back} />}>
      <BottomSheet label={point?.name ?? 'Parking'} onDismiss={goBack}>
        {point ? (
          <>
            <ParkingSummary point={point} detail={detail} />
            <ActionBadge
              title="Navigate"
              subtitle={
                route.data
                  ? `${formatDuration(route.data.durationSeconds)} · ${formatDistance(route.data.distanceMeters)}`
                  : route.isError
                    ? 'Route unavailable'
                    : 'Finding route…'
              }
              icon="navigate"
              onClick={() => {
                tapFeedback(ImpactStyle.Medium);
                startNavigation(route.origin);
                router.push(paths.navigate(point.id));
              }}
            />
          </>
        ) : !isPending ? (
          <div className={styles.message}>
            <h1 className={styles.title}>{isError ? 'Couldn’t load parking' : 'This parking is no longer listed'}</h1>
            {isError ? (
              <Button variant="secondary" block onClick={() => void refetch()}>
                Try again
              </Button>
            ) : (
              <Button variant="secondary" block onClick={goBack}>
                Back to map
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.loading} aria-busy="true" aria-label="Loading parking">
            <Skeleton width="60%" height={24} />
            <Skeleton width="45%" height={14} />
            <Skeleton height={10} radius={5} />
            <Skeleton height={64} radius={32} />
          </div>
        )}
      </BottomSheet>
    </MapScreen>
  );
}
