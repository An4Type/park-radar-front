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
import { pointAtAlong, remainingFromAlong } from '@/features/navigation/lib/routeMatcher';
import { useParkingPoint } from '@/features/parking/hooks';
import { FILLING_UP_BELOW } from '@/features/parking/lib/availability';
import { useAddress, useReport } from '@/features/reports/hooks';
import { useT } from '@/shared/i18n';
import { formatArrival, formatDistance, formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { ActionBadge, InfoBanner, MapScreen } from '@/shared/ui';

const OFF_ROUTE_FIXES_BEFORE_REROUTE = 3;
const MIN_REROUTE_INTERVAL_MS = 10_000;
const GLIDE_MIN_MS = 300;
const GLIDE_MAX_MS = 1_500;
const GLIDE_MAX_JUMP_M = 250;

export type NavigationTarget = 'parking' | 'report';

export default function NavigationPage({ target }: { target: NavigationTarget }) {
  const { parkingId, reportId } = useParams<{ parkingId?: string; reportId?: string }>();
  const router = useIonRouter();
  const camera = useMapCamera();
  const t = useT();
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

  const { point: parking } = useParkingPoint(target === 'parking' ? parkingId : undefined);
  const { report } = useReport(target === 'report' ? reportId : undefined);
  const reportAddress = useAddress(report ?? null);
  const goal = parking ?? report;
  const goalName = parking?.name ?? (report ? reportAddress.data || t.common.reportedSpot : undefined);
  const { data: route, isFetching: routing } = useActiveRoute(goal);
  const guidance = useRouteGuidance(route, position);

  const marker = guidance?.onRoute
    ? { position: guidance.snapped.point, bearing: guidance.snapped.bearing }
    : { position, bearing: heading };

  const glide = useRef({ along: null as number | null, frame: 0, lastFix: 0 });
  useEffect(() => {
    if (!guidance) return;
    const state = glide.current;
    cancelAnimationFrame(state.frame);
    const now = performance.now();
    const sinceLastFix = state.lastFix ? now - state.lastFix : GLIDE_MIN_MS;
    state.lastFix = now;

    if (!guidance.onRoute) {
      state.along = null;
      setGuidance({ position, bearing: heading }, null);
      return;
    }

    const { prepared } = guidance;
    const to = guidance.snapped.along;
    const from = state.along;
    if (from === null || Math.abs(to - from) > GLIDE_MAX_JUMP_M) {
      state.along = to;
      setGuidance({ position: guidance.snapped.point, bearing: guidance.snapped.bearing }, guidance.remainingGeometry);
      return;
    }

    const duration = Math.min(GLIDE_MAX_MS, Math.max(GLIDE_MIN_MS, sinceLastFix));
    const step = (time: number) => {
      const k = Math.min(1, (time - now) / duration);
      const along = from + (to - from) * k;
      const { point, bearing } = pointAtAlong(prepared, along);
      state.along = along;
      setGuidance({ position: point, bearing }, remainingFromAlong(prepared, along));
      if (k < 1) state.frame = requestAnimationFrame(step);
    };
    state.frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(state.frame);
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
            distance={guidance?.arrived ? t.navigation.arrived : guidance ? formatDistance(guidance.distanceToStepMeters) : undefined}
            instruction={guidance?.arrived && goalName ? t.navigation.parkAt(goalName) : step?.instruction}
          />
          {rerouting ? (
            <InfoBanner icon="navigate">{t.navigation.rerouting}</InfoBanner>
          ) : (
            parking &&
            parking.free < FILLING_UP_BELOW && (
              <InfoBanner tone="warning">
                {parking.free === 0 ? (
                  <>
                    <b>{parking.name}</b>
                    {t.navigation.isFull}
                  </>
                ) : (
                  <>
                    {t.navigation.fillingUpBefore}
                    <b>{parking.free}</b>
                    {t.navigation.fillingUpAfter(parking.free)}
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
          title={
            goal && route
              ? `${formatDuration(remaining)} · ${parking ? t.common.free(parking.free) : report ? t.report.status[report.level] : ''}`
              : t.navigation.starting
          }
          subtitle={goal && route ? t.navigation.arrive(formatArrival(remaining), goalName ?? '') : t.navigation.tapToCancel}
          icon="close"
          ariaLabel={goalName ? t.navigation.endTo(goalName) : t.navigation.end}
          onClick={end}
        />
      }
    />
  );
}
