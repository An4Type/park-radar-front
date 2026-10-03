import styles from './Meter.module.css';

export interface MeterProps {
  value: number;
  max: number;
  label: string;
}

export function Meter({ value, max, label }: MeterProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className={styles.track}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
