import type { ReactNode } from 'react';
import styles from './ListRow.module.css';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function ListRow({ title, subtitle, trailing, onClick }: ListRowProps) {
  return (
    <li className={styles.item}>
      <button type="button" className={styles.row} onClick={onClick}>
        <span className={styles.text}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
        {trailing}
      </button>
    </li>
  );
}

export function List({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className={styles.list} aria-label={label}>
      {children}
    </ul>
  );
}
