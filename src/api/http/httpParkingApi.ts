import { ApiError } from '../errors';
import { parseParkingItems, parseZoneItems, toParkingReport } from '../mappers';
import type { ParkingApi } from '../types';
import { DestinationListSchema, RawParkingResponseSchema, RawZonesResponseSchema, RouteSchema, ZoneDtoSchema } from '../schemas';
import { getParsed, httpClient } from './client';

const LOCAL_REPORT_TTL_MS = 30 * 60_000;

export const httpParkingApi: ParkingApi = {
  getSnapshot: async ({ near }, signal) => {
    const response = await getParsed('/parking', RawParkingResponseSchema, {
      params: { lat: near.lat, lng: near.lng },
      signal,
    });
    const { snapshot, rejected } = parseParkingItems(response.parking);
    if (rejected > 0) console.warn(`[parking] skipped ${rejected} invalid facilities`);
    if (snapshot.points.length === 0 && rejected > 0) {
      throw new ApiError('invalid-response', 'No valid parking in response');
    }
    return snapshot;
  },

  searchDestinations: ({ query, near }, signal) =>
    getParsed('/destinations', DestinationListSchema, {
      params: { q: query, lat: near.lat, lng: near.lng },
      signal,
    }),

  getRoute: ({ from, to }, signal) =>
    getParsed('/routes', RouteSchema, {
      params: { fromLat: from.lat, fromLng: from.lng, toLat: to.lat, toLng: to.lng },
      signal,
    }),

  getReports: async ({ near }, signal) => {
    const response = await getParsed('/zones', RawZonesResponseSchema, {
      params: { lat: near.lat, lng: near.lng },
      signal,
    });
    const { reports, rejected } = parseZoneItems(response.zones);
    if (rejected > 0) console.warn(`[zones] skipped ${rejected} invalid reports`);
    return reports;
  },

  submitReport: async ({ location, level }) => {
    const { data } = await httpClient.post<unknown>(
      '/zones',
      { latitude: location.lat, longitude: location.lng, level },
      { headers: { 'Content-Type': 'application/json' } },
    );
    const created = ZoneDtoSchema.safeParse(data);
    if (created.success) return toParkingReport(created.data);
    const now = Date.now();
    return {
      id: `local-${now.toString(36)}`,
      lat: location.lat,
      lng: location.lng,
      level,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + LOCAL_REPORT_TTL_MS).toISOString(),
    };
  },
};
