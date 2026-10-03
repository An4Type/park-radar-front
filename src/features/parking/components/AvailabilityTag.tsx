import { AVAILABILITY_LABEL, type AvailabilityLevel } from '../lib/availability';
import styles from './AvailabilityTag.module.css';

export function AvailabilityTag({ level }: { level: AvailabilityLevel }) {
  return (
    <span className={styles.tag}>
      <span className={[styles.dot, styles[level]].join(' ')} aria-hidden="true" />
      {AVAILABILITY_LABEL[level]}
    </span>
  );
}
