import { create } from 'zustand';
import type { LatLng } from '@/api/types';
import type { GeoErrorKind, GeoFix } from './services/geolocation';

export type LocationStatus = 'idle' | 'locating' | 'tracking' | GeoErrorKind;

interface LocationState {
  status: LocationStatus;
  position: LatLng | null;
  accuracy: number | null;
  heading: number | null;
  setFix: (fix: GeoFix) => void;
  setStatus: (status: LocationStatus) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  status: 'idle',
  position: null,
  accuracy: null,
  heading: null,
  setFix: ({ lat, lng, accuracy, heading }) =>
    set((state) => ({
      status: 'tracking',
      position: { lat, lng },
      accuracy,
      heading: heading ?? state.heading,
    })),
  setStatus: (status) => set({ status }),
}));
