import { IonRouterOutlet, useIonRouter } from '@ionic/react';
import { Navigate, Route } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocationTracking } from '@/features/location/hooks';
import { MapHost } from '@/features/map/components/MapHost';
import HomePage from '@/pages/HomePage/HomePage';
import NavigationPage from '@/pages/NavigationPage/NavigationPage';
import SearchPage, { type ShowcaseLiveLocationRequest } from '@/pages/SearchPage/SearchPage';
import ParkingPage from '@/pages/ParkingPage/ParkingPage';
import PlacePage from '@/pages/PlacePage/PlacePage';
import ReportPage from '@/pages/ReportPage/ReportPage';
import { paths, routePatterns } from '@/shared/navigation/paths';
import { fadeTransition } from '@/shared/navigation/transitions';
import { useAndroidBackExit } from './native';

interface LiveLocationMessage {
  type: 'park-radar:go-to-live-location';
  requestId: string;
  query: string;
}

interface PendingLiveLocationRequest extends ShowcaseLiveLocationRequest {
  parentOrigin: string;
}

function isLiveLocationMessage(value: unknown): value is LiveLocationMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<LiveLocationMessage>;
  return message.type === 'park-radar:go-to-live-location'
    && typeof message.requestId === 'string'
    && message.requestId.length > 0
    && typeof message.query === 'string'
    && message.query.trim().length > 0
    && message.query.length <= 120;
}

export function AppShell() {
  const router = useIonRouter();
  useLocationTracking();
  useAndroidBackExit();
  const [liveLocationRequest, setLiveLocationRequest] = useState<PendingLiveLocationRequest | null>(null);
  const liveLocationRequestRef = useRef<PendingLiveLocationRequest | null>(null);

  useEffect(() => {
    const receiveLiveLocationRequest = (event: MessageEvent<unknown>) => {
      if (window.parent === window || event.source !== window.parent || !isLiveLocationMessage(event.data)) return;
      const request = {
        id: event.data.requestId,
        query: event.data.query.trim(),
        parentOrigin: event.origin,
      };
      liveLocationRequestRef.current = request;
      setLiveLocationRequest(request);
      router.push(paths.search);
    };

    window.addEventListener('message', receiveLiveLocationRequest);
    return () => window.removeEventListener('message', receiveLiveLocationRequest);
  }, [router]);

  const completeLiveLocationRequest = useCallback((requestId: string, selected: boolean) => {
    const request = liveLocationRequestRef.current;
    if (!request || request.id !== requestId) return;
    window.parent.postMessage({
      type: 'park-radar:live-location-complete',
      requestId,
      selected,
    }, request.parentOrigin);
    liveLocationRequestRef.current = null;
    setLiveLocationRequest(null);
  }, []);

  return (
    <>
      <MapHost />
      <IonRouterOutlet className="pr-outlet" animation={fadeTransition} swipeGesture={false}>
        <Route path={routePatterns.home} element={<HomePage />} />
        <Route
          path={routePatterns.search}
          element={<SearchPage showcaseLiveLocationRequest={liveLocationRequest} onShowcaseLiveLocationComplete={completeLiveLocationRequest} />}
        />
        <Route path={routePatterns.parking} element={<ParkingPage />} />
        <Route path={routePatterns.navigateReport} element={<NavigationPage target="report" />} />
        <Route path={routePatterns.navigate} element={<NavigationPage target="parking" />} />
        <Route path={routePatterns.report} element={<ReportPage />} />
        <Route path={routePatterns.place} element={<PlacePage />} />
        <Route path="*" element={<Navigate to={routePatterns.home} replace />} />
      </IonRouterOutlet>
    </>
  );
}
