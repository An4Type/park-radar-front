import { create } from 'zustand';
import type { LatLng } from '@/api/types';
import type { GeoErrorKind, GeoFix } from './services/geolocation';

export type LocationStatus = 'idle' | 'locating' | 'tracking' | GeoErrorKind;

interface LocationState {
  status: LocationStatus;
  blocked: boolean;
  attempt: number;
  position: LatLng | null;
  accuracy: number | null;
  heading: number | null;
  setFix: (fix: GeoFix) => void;
  setStatus: (status: LocationStatus) => void;
  setError: (kind: GeoErrorKind, blocked?: boolean) => void;
  retry: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  status: 'idle',
  blocked: false,
  attempt: 0,
  position: null,
  accuracy: null,
  heading: null,
  setFix: ({ lat, lng, accuracy, heading }) =>
    set((state) => ({
      status: 'tracking',
      blocked: false,
      position: { lat, lng },
      accuracy,
      heading: heading ?? state.heading,
    })),
  setStatus: (status) => set({ status }),
  setError: (kind, blocked = false) =>
    set((state) =>
      state.position && kind === 'unavailable' ? {} : { status: kind, blocked: kind === 'denied' && blocked },
    ),
  retry: () => set((state) => ({ attempt: state.attempt + 1, status: 'locating' })),
}));
