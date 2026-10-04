import { distanceMeters, roundLatLng } from '@/shared/lib/geo';
import { ApiError } from '../errors';
import { toParkingSnapshot } from '../mappers';
import { ParkingResponseSchema } from '../schemas';
import type { Destination, LatLng, ParkingApi, Route } from '../types';
import { DESTINATIONS } from './fixtures';
import { parkingDtos } from './pointGenerator';
import { osrmRoute } from './routing/osrmRoute';
import { valhallaRoute } from './routing/valhallaRoute';
import { withTimeout } from './routing/withTimeout';
import { routeBetween } from './routeGenerator';

export interface MockOptions {
  latency?: [number, number];
  now?: () => number;
  routers?: ReadonlyArray<Router>;
  routerTimeoutMs?: number;
}

type Router = (from: LatLng, to: LatLng, signal?: AbortSignal) => Promise<Route>;

function delay([min, max]: [number, number], signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ApiError('aborted', 'Request was cancelled'));
    const timer = setTimeout(resolve, min + Math.random() * (max - min));
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new ApiError('aborted', 'Request was cancelled'));
      },
      { once: true },
    );
  });
}

const METERS_PER_DEG_LAT = 111_320;

function offset(origin: LatLng, east: number, north: number): LatLng {
  return {
    lat: origin.lat + north / METERS_PER_DEG_LAT,
    lng: origin.lng + east / (METERS_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180)),
  };
}

const SUGGESTION_COUNT = 6;

export function createMockParkingApi({
  latency = [120, 380],
  now = Date.now,
  routers = [valhallaRoute, osrmRoute],
  routerTimeoutMs = 5_000,
}: MockOptions = {}): ParkingApi {
  return {
    async getSnapshot({ near }, signal) {
      await delay(latency, signal);
      const response = ParkingResponseSchema.parse({ parking: parkingDtos(roundLatLng(near, 2), now()) });
      return toParkingSnapshot(response);
    },

    async searchDestinations({ query, near }, signal) {
      await delay(latency, signal);
      const anchor = roundLatLng(near, 2);
      const needle = query.trim().toLowerCase();

      const results: Destination[] = DESTINATIONS.filter((d) => !needle || d.name.toLowerCase().includes(needle))
        .map((d) => ({
          id: d.id,
          name: d.name,
          location: 'location' in d ? d.location : offset(anchor, d.east, d.north),
        }))
        .sort((a, b) => distanceMeters(near, a.location) - distanceMeters(near, b.location));

      return needle ? results : results.slice(0, SUGGESTION_COUNT);
    },

    async getRoute({ from, to }, signal) {
      if (routers.length === 0) await delay(latency, signal);
      for (const router of routers) {
        try {
          return await withTimeout((s) => router(from, to, s), routerTimeoutMs, signal);
        } catch (error) {
          if (signal?.aborted) throw new ApiError('aborted', 'Request was cancelled', { cause: error });
        }
      }
      return routeBetween(from, to);
    },
  };
}
