import { useMemo } from 'react';
import { useEscape } from '@/shared/hooks/useEscape';
import { useT } from '@/shared/i18n';
import { BottomSheet, Button, IconButton } from '@/shared/ui';
import { detectPlatform } from '../lib/platform';
import styles from './LocationHelpSheet.module.css';

export function LocationHelpSheet({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  useEscape(onClose);
  const t = useT();
  const platform = useMemo(() => detectPlatform(), []);
  const { title, steps } = t.location.platforms[platform];

  return (
    <div className={styles.root}>
      <button type="button" tabIndex={-1} aria-label={t.common.close} className={styles.scrim} onClick={onClose} />
      <BottomSheet label={title} onDismiss={onClose}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.lead}>{t.location.lead}</p>
          </div>
          <IconButton icon="close" label={t.common.close} variant="flat" onClick={onClose} />
        </header>
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Button block onClick={onRetry}>
          {t.common.tryAgain}
        </Button>
      </BottomSheet>
    </div>
  );
}
