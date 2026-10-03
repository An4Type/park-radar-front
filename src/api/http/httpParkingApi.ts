import { toParkingSnapshot } from '../mappers';
import type { ParkingApi } from '../types';
import { DestinationListSchema, ParkingResponseSchema, RouteSchema } from '../schemas';
import { getParsed } from './client';

export const httpParkingApi: ParkingApi = {
  getSnapshot: async ({ near }, signal) =>
    toParkingSnapshot(
      await getParsed('/parking', ParkingResponseSchema, {
        params: { lat: near.lat, lng: near.lng },
        signal,
      }),
    ),

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
