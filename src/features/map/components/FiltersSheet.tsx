import { useEffect, useMemo, useRef } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
import { useT } from '@/shared/i18n';
import { useParking } from '@/features/parking/hooks';
import { activeFilterCount, availableTypes, type FilterKind } from '@/features/parking/lib/filters';
import { formatParkingType } from '@/features/parking/lib/parkingType';
import { BottomSheet, Button, Icon, IconButton, SegmentedControl, SwitchRow } from '@/shared/ui';
import { FEE_FILTERS, FILTER_KINDS, useMapStore } from '../mapStore';
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
  const t = useT();
  const feeOptions = useMemo(() => FEE_FILTERS.map((value) => ({ value, label: t.filters.fee[value] })), [t]);
  const [freeNow, ...spaces] = FILTER_KINDS;

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="switch"]')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      className={styles.root}
    >
      <button type="button" tabIndex={-1} aria-label={t.filters.close} className={styles.scrim} onClick={onClose} />
      <BottomSheet label={t.filters.title} onDismiss={onClose} modal>
        <header className={styles.header}>
          <h2 className={styles.title}>{t.filters.title}</h2>
          <div className={styles.headerActions}>
            <Button variant="text" disabled={activeFilterCount(filters) === 0} onClick={clearFilters}>
              {t.filters.clearAll}
            </Button>
            <IconButton icon="close" label={t.filters.close} variant="flat" onClick={onClose} />
          </div>
        </header>

        <section className={styles.section}>
          <h3 className={styles.overline}>{t.filters.availability}</h3>
          <SwitchRow
            icon={FILTER_ICONS[freeNow]}
            label={t.filters.options[freeNow].label}
            description={t.filters.options[freeNow].description}
            checked={filters[freeNow]}
            onChange={(checked) => setFilter(freeNow, checked)}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.overline}>{t.filters.price}</h3>
          <SegmentedControl label={t.filters.price} options={feeOptions} value={filters.fee} onChange={setFee} />
        </section>

        {types.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.overline}>{t.filters.parkingType}</h3>
            <div className={styles.chips} role="group" aria-label={t.filters.parkingType}>
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
          <h3 className={styles.overline}>{t.filters.spaces}</h3>
          <div className={styles.list}>
            {spaces.map((kind) => (
              <SwitchRow
                key={kind}
                icon={FILTER_ICONS[kind]}
                label={t.filters.options[kind].label}
                description={t.filters.options[kind].description}
                checked={filters[kind]}
                onChange={(checked) => setFilter(kind, checked)}
              />
            ))}
          </div>
        </section>
      </BottomSheet>
    </div>
  );
}
