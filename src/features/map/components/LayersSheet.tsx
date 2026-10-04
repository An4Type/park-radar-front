import { useEffect, useRef } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
import { BottomSheet, Icon, IconButton, SegmentedControl, SwitchRow } from '@/shared/ui';
import { LABEL_OPTIONS, LAYER_OPTIONS, useMapStore, type LabelKind } from '../mapStore';
import styles from './LayersSheet.module.css';

const LABEL_ICONS: Record<LabelKind, React.ReactNode> = {
  free: 'P',
  accessible: <Icon name="accessible" size={20} />,
  ev: <Icon name="ev" size={20} />,
};

export function LayersSheet({ onClose }: { onClose: () => void }) {
  const layerMode = useMapStore((s) => s.layerMode);
  const setLayerMode = useMapStore((s) => s.setLayerMode);
  const labels = useMapStore((s) => s.labels);
  const setLabel = useMapStore((s) => s.setLabel);
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      className={styles.root}
    >
      <button type="button" tabIndex={-1} aria-label="Close map layers" className={styles.scrim} onClick={onClose} />
      <BottomSheet label="Map layers" onDismiss={onClose}>
        <header className={styles.header}>
          <h2 className={styles.title}>Map layers</h2>
          <IconButton icon="close" label="Close map layers" variant="flat" onClick={onClose} />
        </header>

        <section className={styles.section}>
          <h3 className={styles.overline}>Show parking as</h3>
          <SegmentedControl label="Show parking as" options={LAYER_OPTIONS} value={layerMode} onChange={setLayerMode} />
        </section>

        <section className={styles.section}>
          <h3 className={styles.overline}>Labels</h3>
          <div className={styles.list}>
            {LABEL_OPTIONS.map((option) => (
              <SwitchRow
                key={option.value}
                icon={LABEL_ICONS[option.value]}
                label={option.label}
                description={option.description}
                checked={labels[option.value]}
                onChange={(checked) => setLabel(option.value, checked)}
              />
            ))}
          </div>
          <p className={styles.hint}>Labels appear when you zoom in.</p>
        </section>
      </BottomSheet>
    </div>
  );
}
