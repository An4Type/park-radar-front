import { useIonRouter } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUserPosition } from '@/features/location/hooks';
import { useLocationStore } from '@/features/location/locationStore';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { InstructionCard } from '@/features/navigation/components/InstructionCard';
import { useActiveRoute, useRouteGuidance } from '@/features/navigation/hooks';
import { useNavigationStore } from '@/features/navigation/navigationStore';
import { useTripStore } from '@/features/navigation/tripStore';
import { useParkingPoint } from '@/features/parking/hooks';
import { FILLING_UP_BELOW } from '@/features/parking/lib/availability';
import { formatArrival, formatDistance, formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { ActionBadge, InfoBanner, MapScreen } from '@/shared/ui';

const OFF_ROUTE_FIXES_BEFORE_REROUTE = 3;
const MIN_REROUTE_INTERVAL_MS = 10_000;

export default function NavigationPage() {
  const { parkingId } = useParams<{ parkingId: string }>();
  const router = useIonRouter();
  const camera = useMapCamera();
  const { position, isFallback } = useUserPosition();
  const heading = useLocationStore((s) => s.heading);
  const routeOrigin = useTripStore((s) => s.routeOrigin);
  const startNavigation = useTripStore((s) => s.startNavigation);
  const endNavigation = useTripStore((s) => s.endNavigation);
  const setGuidance = useNavigationStore((s) => s.setGuidance);
  const clearGuidance = useNavigationStore((s) => s.clear);

  useEffect(() => {
    if (!routeOrigin) startNavigation(position);
  }, [position, routeOrigin, startNavigation]);

  const { point: parking } = useParkingPoint(parkingId);
  const { data: route, isFetching: routing } = useActiveRoute(parking);
  const guidance = useRouteGuidance(route, position);

  const marker = guidance?.onRoute
    ? { position: guidance.snapped.point, bearing: guidance.snapped.bearing }
    : { position, bearing: heading };

  useEffect(() => {
    if (!guidance) return;
    setGuidance(
      guidance.onRoute ? { position: guidance.snapped.point, bearing: guidance.snapped.bearing } : { position, bearing: heading },
      guidance.onRoute ? guidance.remainingGeometry : null,
    );
  }, [guidance, heading, position, setGuidance]);

  useEffect(() => clearGuidance, [clearGuidance]);

  const offRouteFixes = useRef(0);
  const lastReroute = useRef(0);
  const countedGuidance = useRef<typeof guidance>(null);
  const [joinedRoute, setJoinedRoute] = useState<typeof route>(undefined);
  const joined = Boolean(route) && joinedRoute === route;

  useEffect(() => {
    if (guidance?.onRoute && route && joinedRoute !== route) setJoinedRoute(route);
  }, [guidance, joinedRoute, route]);

  useEffect(() => {
    if (!guidance || guidance === countedGuidance.current || isFallback || guidance.arrived || !joined) return;
    countedGuidance.current = guidance;
    offRouteFixes.current = guidance.onRoute ? 0 : offRouteFixes.current + 1;
    if (offRouteFixes.current >= OFF_ROUTE_FIXES_BEFORE_REROUTE && Date.now() - lastReroute.current > MIN_REROUTE_INTERVAL_MS) {
      offRouteFixes.current = 0;
      lastReroute.current = Date.now();
      startNavigation(position);
    }
  }, [guidance, isFallback, joined, position, startNavigation]);

  const framedRoute = useRef<typeof route>(undefined);
  useEffect(() => {
    if (!route) return;
    if (framedRoute.current !== route) {
      if (camera.fitTo(route.geometry, { top: 200, bottom: 160, left: 60, right: 60 }, 17)) {
        framedRoute.current = route;
      }
      return;
    }
    if (!isFallback) camera.follow(marker.position, marker.bearing);
  }, [camera, isFallback, marker.bearing, marker.position, route]);

  const end = () => {
    tapFeedback();
    endNavigation();
    clearGuidance();
    camera.resetNorth();
    router.navigateRoot(paths.home);
  };

  const rerouting = (joined && Boolean(guidance && !guidance.onRoute && !isFallback)) || (routing && Boolean(route));
  const step = route && guidance ? route.steps[guidance.stepIndex] : undefined;
  const remaining = guidance?.remainingSeconds ?? route?.durationSeconds ?? 0;

  return (
    <MapScreen
      top={
        <>
          <InstructionCard
            maneuver={guidance?.arrived ? 'arrive' : step?.maneuver}
            distance={guidance?.arrived ? 'Arrived' : guidance ? formatDistance(guidance.distanceToStepMeters) : undefined}
            instruction={guidance?.arrived && parking ? `Park at ${parking.name}` : step?.instruction}
          />
          {rerouting ? (
            <InfoBanner icon="navigate">Rerouting…</InfoBanner>
          ) : (
            parking &&
            parking.free < FILLING_UP_BELOW && (
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
            )
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
