import { IonRouterOutlet } from '@ionic/react';
import { Navigate, Route } from 'react-router-dom';
import { useLocationTracking } from '@/features/location/hooks';
import { MapHost } from '@/features/map/components/MapHost';
import HomePage from '@/pages/HomePage/HomePage';
import NavigationPage from '@/pages/NavigationPage/NavigationPage';
import SearchPage from '@/pages/SearchPage/SearchPage';
import ParkingPage from '@/pages/ParkingPage/ParkingPage';
import PlacePage from '@/pages/PlacePage/PlacePage';
import ReportPage from '@/pages/ReportPage/ReportPage';
import { routePatterns } from '@/shared/navigation/paths';
import { fadeTransition } from '@/shared/navigation/transitions';
import { useAndroidBackExit } from './native';

export function AppShell() {
  useLocationTracking();
  useAndroidBackExit();

  return (
    <>
      <MapHost />
      <IonRouterOutlet className="pr-outlet" animation={fadeTransition} swipeGesture={false}>
        <Route path={routePatterns.home} element={<HomePage />} />
        <Route path={routePatterns.search} element={<SearchPage />} />
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
