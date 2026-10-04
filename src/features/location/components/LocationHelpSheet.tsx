import { useMemo } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
import { BottomSheet, Button, IconButton } from '@/shared/ui';
import { detectPlatform, LOCATION_STEPS } from '../lib/platform';
import styles from './LocationHelpSheet.module.css';

export function LocationHelpSheet({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  useEscape(onClose);
  const { title, steps } = useMemo(() => LOCATION_STEPS[detectPlatform()], []);

  return (
    <div className={styles.root}>
      <button type="button" tabIndex={-1} aria-label="Close" className={styles.scrim} onClick={onClose} />
      <BottomSheet label={title} onDismiss={onClose}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.lead}>Your device didn’t let Park Radar use your location. Turn it on, then try again.</p>
          </div>
          <IconButton icon="close" label="Close" variant="flat" onClick={onClose} />
        </header>
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Button block onClick={onRetry}>
          Try again
        </Button>
      </BottomSheet>
    </div>
  );
}
