import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LayerMode = 'zones' | 'heat' | 'off';

export const LAYER_OPTIONS: ReadonlyArray<{ value: LayerMode; label: string }> = [
  { value: 'zones', label: 'Zones' },
  { value: 'heat', label: 'Soft heat' },
  { value: 'off', label: 'Off' },
];

interface MapState {
  layerMode: LayerMode;
  setLayerMode: (mode: LayerMode) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      layerMode: 'zones',
      setLayerMode: (layerMode) => set({ layerMode }),
    }),
    {
      name: 'park-radar.map',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
