import { useEffect, useMemo, useRef } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
import { useParking } from '@/features/parking/hooks';
import { activeFilterCount, availableTypes, type FilterKind } from '@/features/parking/lib/filters';
import { formatParkingType } from '@/features/parking/lib/parkingType';
import { BottomSheet, Button, Icon, IconButton, SegmentedControl, SwitchRow } from '@/shared/ui';
import { FEE_OPTIONS, FILTER_OPTIONS, useMapStore } from '../mapStore';
import styles from './LayersSheet.module.css';

const FILTER_ICONS: Record<FilterKind, React.ReactNode> = {
  free: <Icon name="check" size={20} />,
  ev: <Icon name="ev" size={20} />,
  accessible: <Icon name="accessible" size={20} />,
};

export function FiltersSheet({ onClose }: { onClose: () => void }) {
  const filters = useMapStore((s) => s.filters);
  const setFilter = useMapStore((s) => s.setFilter);
  const setFee = useMapStore((s) => s.setFee);
  const toggleType = useMapStore((s) => s.toggleType);
  const clearFilters = useMapStore((s) => s.clearFilters);
  const { points } = useParking();
  const types = useMemo(() => [...new Set([...availableTypes(points), ...filters.types])].sort(), [points, filters.types]);
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose);
  const [freeNow, ...spaces] = FILTER_OPTIONS;

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="switch"]')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      className={styles.root}
    >
      <button type="button" tabIndex={-1} aria-label="Close filters" className={styles.scrim} onClick={onClose} />
      <BottomSheet label="Filters" onDismiss={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>Filters</h2>
          <div className={styles.headerActions}>
            <Button variant="text" disabled={activeFilterCount(filters) === 0} onClick={clearFilters}>
              Clear all
            </Button>
            <IconButton icon="close" label="Close filters" variant="flat" onClick={onClose} />
          </div>
        </header>

        <section className={styles.section}>
          <h3 className={styles.overline}>Availability</h3>
          <SwitchRow
            icon={FILTER_ICONS[freeNow.value]}
            label={freeNow.label}
            description={freeNow.description}
            checked={filters[freeNow.value]}
            onChange={(checked) => setFilter(freeNow.value, checked)}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.overline}>Price</h3>
          <SegmentedControl label="Price" options={FEE_OPTIONS} value={filters.fee} onChange={setFee} />
        </section>

        {types.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.overline}>Parking type</h3>
            <div className={styles.chips} role="group" aria-label="Parking type">
              {types.map((type) => {
                const selected = filters.types.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    className={[styles.chip, selected && styles.chipOn].filter(Boolean).join(' ')}
                    onClick={() => toggleType(type)}
                  >
                    {selected && <Icon name="check" size={16} strokeWidth={2.6} />}
                    {formatParkingType(type)}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h3 className={styles.overline}>Spaces</h3>
          <div className={styles.list}>
            {spaces.map((option) => (
              <SwitchRow
                key={option.value}
                icon={FILTER_ICONS[option.value]}
                label={option.label}
                description={option.description}
                checked={filters[option.value]}
                onChange={(checked) => setFilter(option.value, checked)}
              />
            ))}
          </div>
        </section>
      </BottomSheet>
    </div>
  );
}
