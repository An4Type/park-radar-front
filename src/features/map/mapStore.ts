import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { NO_FILTERS, type FeeFilter, type FilterKind, type ParkingFilters } from '@/features/parking/lib/filters';
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

export const FEE_OPTIONS: ReadonlyArray<{ value: FeeFilter; label: string }> = [
  { value: 'any', label: 'Any' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

export const FILTER_OPTIONS: ReadonlyArray<{ value: FilterKind; label: string; description: string }> = [
  { value: 'free', label: 'Free spaces now', description: 'Hide full and closed parkings' },
  { value: 'ev', label: 'EV charging', description: 'Parkings with chargers' },
  { value: 'accessible', label: 'Accessible spaces', description: 'Parkings with spaces for disabled drivers' },
];

interface MapState {
  layerMode: LayerMode;
  labels: Record<LabelKind, boolean>;
  filters: ParkingFilters;
  setFilter: (kind: FilterKind, enabled: boolean) => void;
  setFee: (fee: FeeFilter) => void;
  toggleType: (type: string) => void;
  clearFilters: () => void;
  setLayerMode: (mode: LayerMode) => void;
  setLabel: (kind: LabelKind, visible: boolean) => void;
}

const DEFAULT_LABELS: Record<LabelKind, boolean> = { free: true, accessible: false, ev: false };

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      layerMode: 'auto',
      labels: DEFAULT_LABELS,
      filters: NO_FILTERS,
      setFilter: (kind, enabled) => set((state) => ({ filters: { ...state.filters, [kind]: enabled } })),
      setFee: (fee) => set((state) => ({ filters: { ...state.filters, fee } })),
      toggleType: (type) =>
        set((state) => {
          const types = state.filters.types.includes(type)
            ? state.filters.types.filter((t) => t !== type)
            : [...state.filters.types, type];
          return { filters: { ...state.filters, types } };
        }),
      clearFilters: () => set({ filters: NO_FILTERS }),
      setLayerMode: (layerMode) => set({ layerMode }),
      setLabel: (kind, visible) => set((state) => ({ labels: { ...state.labels, [kind]: visible } })),
    }),
    {
      name: 'park-radar.map',
      storage: createJSONStorage(safeStorage),
      version: 5,
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<MapState>;
        return {
          layerMode: old.layerMode ?? 'auto',
          labels: { ...DEFAULT_LABELS, ...old.labels },
          filters: { ...NO_FILTERS, ...old.filters },
        } as MapState;
      },
    },
  ),
);
