import { useT } from '@/shared/i18n';
import type { AvailabilityLevel } from '../lib/availability';
import styles from './AvailabilityTag.module.css';

export function AvailabilityTag({ level }: { level: AvailabilityLevel }) {
  const t = useT();
  return (
    <span className={styles.tag}>
      <span className={[styles.dot, styles[level]].join(' ')} aria-hidden="true" />
      {t.parking.availability[level]}
    </span>
  );
}
