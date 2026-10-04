import { matchPath } from 'react-router-dom';

export const paths = {
  home: '/',
  search: '/search',
  parking: (parkingId: string) => `/parking/${encodeURIComponent(parkingId)}`,
  navigate: (parkingId: string) => `/navigate/${encodeURIComponent(parkingId)}`,
  report: (reportId: string) => `/report/${encodeURIComponent(reportId)}`,
  navigateReport: (reportId: string) => `/navigate/report/${encodeURIComponent(reportId)}`,
  place: '/place',
} as const;

export const routePatterns = {
  home: '/',
  search: '/search',
  parking: '/parking/:parkingId',
  navigate: '/navigate/:parkingId',
  report: '/report/:reportId',
  navigateReport: '/navigate/report/:reportId',
  place: '/place',
} as const;

export type Screen =
  | { kind: 'home' }
  | { kind: 'search' }
  | { kind: 'parking'; parkingId: string }
  | { kind: 'navigate'; parkingId: string }
  | { kind: 'report'; reportId: string }
  | { kind: 'place' }
  | { kind: 'navigateReport'; reportId: string };

export function screenFor(pathname: string): Screen {
  const navReport = matchPath(routePatterns.navigateReport, pathname);
  if (navReport?.params.reportId) return { kind: 'navigateReport', reportId: navReport.params.reportId };
  const parking = matchPath(routePatterns.parking, pathname);
  if (parking?.params.parkingId) return { kind: 'parking', parkingId: parking.params.parkingId };
  const nav = matchPath(routePatterns.navigate, pathname);
  if (nav?.params.parkingId) return { kind: 'navigate', parkingId: nav.params.parkingId };
  const report = matchPath(routePatterns.report, pathname);
  if (report?.params.reportId) return { kind: 'report', reportId: report.params.reportId };
  if (matchPath(routePatterns.place, pathname)) return { kind: 'place' };
  if (matchPath(routePatterns.search, pathname)) return { kind: 'search' };
  return { kind: 'home' };
}
