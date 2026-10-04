import type { ReactNode } from 'react';
import styles from './SwitchRow.module.css';

export interface SwitchRowProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchRow({ label, description, icon, checked, onChange }: SwitchRowProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.row} onClick={() => onChange(!checked)}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      <span className={[styles.switch, checked && styles.on].filter(Boolean).join(' ')} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  );
}
