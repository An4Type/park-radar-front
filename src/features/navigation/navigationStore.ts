import { create } from 'zustand';
import type { LatLng } from '@/api/types';

export interface GuidanceMarker {
  position: LatLng;
  bearing: number | null;
}

interface NavigationState {
  marker: GuidanceMarker | null;
  remaining: LatLng[] | null;
  setGuidance: (marker: GuidanceMarker | null, remaining: LatLng[] | null) => void;
  clear: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  marker: null,
  remaining: null,
  setGuidance: (marker, remaining) => set({ marker, remaining }),
  clear: () => set({ marker: null, remaining: null }),
}));
