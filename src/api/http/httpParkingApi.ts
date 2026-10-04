import { ApiError } from '../errors';
import { parseParkingItems } from '../mappers';
import type { ParkingApi } from '../types';
import { DestinationListSchema, RawParkingResponseSchema, RouteSchema } from '../schemas';
import { getParsed } from './client';

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
};
