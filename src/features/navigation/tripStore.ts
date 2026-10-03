import { create } from 'zustand';
import type { LatLng } from '@/api/types';

export interface TripDestination {
  name: string;
  location: LatLng;
}

interface TripState {
  destination: TripDestination | null;
  routeOrigin: LatLng | null;
  setDestination: (destination: TripDestination | null) => void;
  startNavigation: (origin: LatLng) => void;
  endNavigation: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  destination: null,
  routeOrigin: null,
  setDestination: (destination) => set({ destination }),
  startNavigation: (origin) => set({ routeOrigin: origin }),
  endNavigation: () => set({ routeOrigin: null, destination: null }),
}));
