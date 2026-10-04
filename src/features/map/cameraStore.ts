import { create } from 'zustand';
import type { LatLng } from '@/api/types';

export interface CameraPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MapCamera {
  ready: boolean;
  flyTo(center: LatLng, zoom?: number): boolean;
  fitTo(points: LatLng[], padding?: CameraPadding, maxZoom?: number): boolean;
  follow(center: LatLng, bearing?: number | null): void;
  resetNorth(): void;
}

interface CameraState {
  fallback: MapCamera | null;
  setFallback: (camera: MapCamera | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  fallback: null,
  setFallback: (fallback) => set({ fallback }),
}));
