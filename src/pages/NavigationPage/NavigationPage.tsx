import { useIonRouter } from '@ionic/react';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { InstructionCard } from '@/features/navigation/components/InstructionCard';
import { useActiveRoute, useNavigationProgress } from '@/features/navigation/hooks';
import { useTripStore } from '@/features/navigation/tripStore';
import { useParkingPoint } from '@/features/parking/hooks';
import { FILLING_UP_BELOW } from '@/features/parking/lib/availability';
import { formatArrival, formatDistance, formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { ActionBadge, InfoBanner, MapScreen } from '@/shared/ui';

export default function NavigationPage() {
  const { parkingId } = useParams<{ parkingId: string }>();
  const router = useIonRouter();
  const camera = useMapCamera();
  const { position, isFallback } = useUserPosition();
  const heading = useLocationStore((s) => s.heading);
  const routeOrigin = useTripStore((s) => s.routeOrigin);
  const startNavigation = useTripStore((s) => s.startNavigation);
  const endNavigation = useTripStore((s) => s.endNavigation);

  useEffect(() => {
    if (!routeOrigin) startNavigation(position);
  }, [position, routeOrigin, startNavigation]);

  const { point: parking } = useParkingPoint(parkingId);
  const { data: route } = useActiveRoute(parking);
  const progress = useNavigationProgress(route, position);

  const framedRoute = useRef<typeof route>(undefined);
  useEffect(() => {
    if (!route) return;
    if (framedRoute.current !== route) {
      if (camera.fitTo(route.geometry, { top: 200, bottom: 160, left: 60, right: 60 }, 17)) {
        framedRoute.current = route;
      }
      return;
    }
    if (!isFallback) camera.follow(position, heading);
  }, [camera, heading, isFallback, position, route]);

  const end = () => {
    tapFeedback();
    endNavigation();
    camera.resetNorth();
    router.navigateRoot(paths.home);
  };

  const step = route && progress ? route.steps[progress.stepIndex] : undefined;
  const remaining = progress?.remainingSeconds ?? route?.durationSeconds ?? 0;

  return (
    <MapScreen
      top={
        <>
          <InstructionCard
            maneuver={progress?.arrived ? 'arrive' : step?.maneuver}
            distance={progress?.arrived ? 'Arrived' : progress ? formatDistance(progress.distanceToStepMeters) : undefined}
            instruction={progress?.arrived && parking ? `Park at ${parking.name}` : step?.instruction}
          />
          {parking && parking.free < FILLING_UP_BELOW && (
            <InfoBanner tone="warning">
              {parking.free === 0 ? (
                <>
                  <b>{parking.name}</b> is full right now
                </>
              ) : (
                <>
                  Filling up · only <b>{parking.free}</b> {parking.free === 1 ? 'space' : 'spaces'} left
                </>
              )}
            </InfoBanner>
          )}
        </>
      }
      bottom={
        <ActionBadge
          tone="dark"
          title={parking && route ? `${formatDuration(remaining)} · ${parking.free} free` : 'Starting navigation…'}
          subtitle={parking && route ? `Arrive ${formatArrival(remaining)} · ${parking.name}` : 'Tap to cancel'}
          icon="close"
          ariaLabel={parking ? `End navigation to ${parking.name}` : 'End navigation'}
          onClick={end}
        />
      }
    />
  );
}
