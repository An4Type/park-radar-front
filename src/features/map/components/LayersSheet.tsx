import { useEffect, useMemo, useRef } from 'react';
import { useT } from '@/shared/i18n';
import { useEscape } from '@/shared/hooks/useEscape';
import { BottomSheet, Icon, IconButton, SegmentedControl, SwitchRow } from '@/shared/ui';
import { LABEL_KINDS, LAYER_MODES, useMapStore, type LabelKind } from '../mapStore';
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
  const t = useT();
  const modeOptions = useMemo(() => LAYER_MODES.map((value) => ({ value, label: t.layers.modes[value] })), [t]);
  useEscape(onClose);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      className={styles.root}
    >
      <button type="button" tabIndex={-1} aria-label={t.layers.close} className={styles.scrim} onClick={onClose} />
      <BottomSheet label={t.layers.title} onDismiss={onClose} modal>
        <header className={styles.header}>
          <h2 className={styles.title}>{t.layers.title}</h2>
          <IconButton icon="close" label={t.layers.close} variant="flat" onClick={onClose} />
        </header>

        <section className={styles.section}>
          <h3 className={styles.overline}>{t.layers.showAs}</h3>
          <SegmentedControl label={t.layers.showAs} options={modeOptions} value={layerMode} onChange={setLayerMode} />
        </section>

        <section className={styles.section}>
          <h3 className={styles.overline}>{t.layers.labels}</h3>
          <div className={styles.list}>
            {LABEL_KINDS.map((kind) => (
              <SwitchRow
                key={kind}
                icon={LABEL_ICONS[kind]}
                label={t.layers.labelOptions[kind].label}
                description={t.layers.labelOptions[kind].description}
                checked={labels[kind]}
                onChange={(checked) => setLabel(kind, checked)}
              />
            ))}
          </div>
          <p className={styles.hint}>{t.layers.hint}</p>
        </section>
      </BottomSheet>
    </div>
  );
}
