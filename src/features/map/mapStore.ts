import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/shared/lib/safeStorage';

export type LayerMode = 'auto' | 'zones' | 'heat' | 'off';
export type LabelKind = 'free' | 'accessible' | 'ev';

export const LAYER_OPTIONS: ReadonlyArray<{ value: LayerMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'zones', label: 'Hexes' },
  { value: 'heat', label: 'Heat' },
  { value: 'off', label: 'Off' },
];

export const LABEL_OPTIONS: ReadonlyArray<{ value: LabelKind; label: string; description: string }> = [
  { value: 'free', label: 'Free spaces', description: 'Free spaces on every parking' },
  { value: 'accessible', label: 'Accessible spaces', description: 'Spaces for disabled drivers' },
  { value: 'ev', label: 'EV charging', description: 'Spaces with a charger' },
];

interface MapState {
  layerMode: LayerMode;
  labels: Record<LabelKind, boolean>;
  setLayerMode: (mode: LayerMode) => void;
  setLabel: (kind: LabelKind, visible: boolean) => void;
}

const DEFAULT_LABELS: Record<LabelKind, boolean> = { free: true, accessible: false, ev: false };

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      layerMode: 'auto',
      labels: DEFAULT_LABELS,
      setLayerMode: (layerMode) => set({ layerMode }),
      setLabel: (kind, visible) => set((state) => ({ labels: { ...state.labels, [kind]: visible } })),
    }),
    {
      name: 'park-radar.map',
      storage: createJSONStorage(safeStorage),
      version: 3,
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<MapState>;
        return { layerMode: 'auto', labels: { ...DEFAULT_LABELS, ...old.labels } } as MapState;
      },
    },
  ),
);
