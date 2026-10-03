import { matchPath } from 'react-router-dom';

export const paths = {
  home: '/',
  search: '/search',
  parking: (parkingId: string) => `/parking/${encodeURIComponent(parkingId)}`,
  navigate: (parkingId: string) => `/navigate/${encodeURIComponent(parkingId)}`,
} as const;

export const routePatterns = {
  home: '/',
  search: '/search',
  parking: '/parking/:parkingId',
  navigate: '/navigate/:parkingId',
} as const;

export type Screen =
  | { kind: 'home' }
  | { kind: 'search' }
  | { kind: 'parking'; parkingId: string }
  | { kind: 'navigate'; parkingId: string };

export function screenFor(pathname: string): Screen {
  const parking = matchPath(routePatterns.parking, pathname);
  if (parking?.params.parkingId) return { kind: 'parking', parkingId: parking.params.parkingId };
  const nav = matchPath(routePatterns.navigate, pathname);
  if (nav?.params.parkingId) return { kind: 'navigate', parkingId: nav.params.parkingId };
  if (matchPath(routePatterns.search, pathname)) return { kind: 'search' };
  return { kind: 'home' };
}
