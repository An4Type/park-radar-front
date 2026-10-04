import type { z } from 'zod';
import type {
  DestinationSchema,
  LatLngSchema,
  ManeuverSchema,
  ParkingDtoSchema,
  ParkingResponseSchema,
  RouteSchema,
  RouteStepSchema,
  ReportLevelSchema,
  ZoneDtoSchema,
} from './schemas';

export type LatLng = z.infer<typeof LatLngSchema>;
export type ParkingDto = z.infer<typeof ParkingDtoSchema>;
export type ParkingResponse = z.infer<typeof ParkingResponseSchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type Maneuver = z.infer<typeof ManeuverSchema>;
export type RouteStep = z.infer<typeof RouteStepSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type ReportLevel = z.infer<typeof ReportLevelSchema>;
export type ZoneDto = z.infer<typeof ZoneDtoSchema>;

export interface ParkingReport {
  id: string;
  lat: number;
  lng: number;
  level: ReportLevel;
  createdAt: string | null;
  expiresAt: string | null;
}

export interface ReportInput {
  location: LatLng;
  level: ReportLevel;
}

export interface ParkingPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  free: number;
  accessibleSpaces: number;
  freeAccessible: number | null;
  evChargingSpaces: number;
  freeEv: number | null;
  paid: boolean | null;
  kind: string | null;
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

export interface ReportsQuery {
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
  getReports(params: ReportsQuery, signal?: AbortSignal): Promise<ParkingReport[]>;
  submitReport(input: ReportInput): Promise<ParkingReport>;
}
