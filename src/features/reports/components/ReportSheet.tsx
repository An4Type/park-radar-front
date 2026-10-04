import { useEffect, useRef, useState } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
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
      <button type="button" tabIndex={-1} aria-label="Close report" className={styles.scrim} onClick={onClose} />
      <BottomSheet label="Report parking" onDismiss={onClose}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title}>How much free parking is here?</h2>
            <p className={styles.address}>
              <Icon name="place" size={16} />
              {!location ? (
                'Turn on location to report'
              ) : address.isPending ? (
                <Skeleton width={160} height={14} />
              ) : (
                address.data || 'Your current location'
              )}
            </p>
          </div>
          <IconButton icon="close" label="Close report" variant="flat" onClick={onClose} />
        </header>

        <div role="radiogroup" aria-label="Free spaces around you" className={styles.options}>
          {REPORT_LEVELS.map((option) => {
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

        {submit.isError && <p className={styles.error}>Couldn’t send your report. Please try again.</p>}

        <Button block disabled={!location || !level || submit.isPending} onClick={send}>
          {submit.isPending ? 'Sending…' : 'Send report'}
        </Button>
      </BottomSheet>
    </div>
  );
}
