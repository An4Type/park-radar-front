import { useEffect, useRef, useState } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
import { useT } from '@/shared/i18n';
import type { LatLng, ReportLevel } from '@/api/types';
import { tapFeedback } from '@/shared/lib/haptics';
import { BottomSheet, Button, Icon, IconButton, Skeleton } from '@/shared/ui';
import { useAddress, useSubmitReport } from '../hooks';
import { REPORT_LEVELS } from '../lib/levels';
import styles from './ReportSheet.module.css';

export interface ReportSheetProps {
  location: LatLng | null;
  onClose: () => void;
  onSent: () => void;
}

export function ReportSheet({ location, onClose, onSent }: ReportSheetProps) {
  const [level, setLevel] = useState<ReportLevel | null>(null);
  const address = useAddress(location);
  const submit = useSubmitReport();
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  useEscape(onClose);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
  }, []);

  const send = () => {
    if (!location || !level) return;
    tapFeedback();
    submit.mutate({ location, level }, { onSuccess: onSent });
  };

  return (
    <div
      ref={ref}
      className={styles.root}
    >
      <button type="button" tabIndex={-1} aria-label={t.report.close} className={styles.scrim} onClick={onClose} />
      <BottomSheet label={t.report.sheetLabel} onDismiss={onClose} modal>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title}>{t.report.question}</h2>
            <p className={styles.address}>
              <Icon name="place" size={16} />
              {!location ? (
                t.report.turnOnLocation
              ) : address.isPending ? (
                <Skeleton width={160} height={14} />
              ) : (
                address.data || t.report.currentLocation
              )}
            </p>
          </div>
          <IconButton icon="close" label={t.report.close} variant="flat" onClick={onClose} />
        </header>

        <div role="radiogroup" aria-label={t.report.levelsLabel} className={styles.options}>
          {REPORT_LEVELS.map((value) => {
            const option = { value, ...t.report.levels[value] };
            const selected = option.value === level;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[styles.option, selected && styles.selected].filter(Boolean).join(' ')}
                onClick={() => setLevel(option.value)}
              >
                <span className={[styles.swatch, styles[option.value]].join(' ')} aria-hidden="true" />
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionHint}>{option.description}</span>
              </button>
            );
          })}
        </div>

        {submit.isError && <p className={styles.error} role="alert">{t.report.failed}</p>}

        <Button block disabled={!location || !level || submit.isPending} onClick={send}>
          {submit.isPending ? t.report.sending : t.report.send}
        </Button>
      </BottomSheet>
    </div>
  );
}
