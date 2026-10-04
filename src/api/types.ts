import type { z } from 'zod';
import type {
  DestinationSchema,
  LatLngSchema,
  ManeuverSchema,
  ParkingDtoSchema,
  ParkingResponseSchema,
  RouteSchema,
  RouteStepSchema,
} from './schemas';

export type LatLng = z.infer<typeof LatLngSchema>;
export type ParkingDto = z.infer<typeof ParkingDtoSchema>;
export type ParkingResponse = z.infer<typeof ParkingResponseSchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type Maneuver = z.infer<typeof ManeuverSchema>;
export type RouteStep = z.infer<typeof RouteStepSchema>;
export type Route = z.infer<typeof RouteSchema>;

export interface ParkingPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  free: number;
  accessibleSpaces: number;
  evChargingSpaces: number;
  active: boolean;
  confidence: number | null;
  updatedAt: string | null;
}

export interface ParkingSnapshot {
  points: ParkingPoint[];
}

export interface SnapshotQuery {
  near: LatLng;
}

export interface DestinationsQuery {
  query: string;
  near: LatLng;
}

export interface RouteQuery {
  from: LatLng;
  to: LatLng;
}

export interface ParkingApi {
  getSnapshot(params: SnapshotQuery, signal?: AbortSignal): Promise<ParkingSnapshot>;
  searchDestinations(params: DestinationsQuery, signal?: AbortSignal): Promise<Destination[]>;
  getRoute(params: RouteQuery, signal?: AbortSignal): Promise<Route>;
}
