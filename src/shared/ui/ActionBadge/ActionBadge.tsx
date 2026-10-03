import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './ActionBadge.module.css';

export interface ActionBadgeProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: IconName;
  tone?: 'primary' | 'dark';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function ActionBadge({
  title,
  subtitle,
  icon,
  tone = 'primary',
  onClick,
  disabled,
  loading,
  ariaLabel,
  className,
}: ActionBadgeProps) {
  return (
    <button
      type="button"
      className={[styles.badge, styles[tone], loading && styles.loading, className].filter(Boolean).join(' ')}
      onClick={loading ? undefined : onClick}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
    >
      <span className={styles.text}>
        {loading ? (
          <>
            <Skeleton tone="onPrimary" width={130} height={18} />
            <Skeleton tone="onPrimary" width={170} height={12} />
          </>
        ) : (
          <>
            <span className={styles.title}>{title}</span>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </>
        )}
      </span>
      <span className={styles.trailing}>
        <Icon name={icon} size={icon === 'close' ? 18 : 20} strokeWidth={icon === 'close' ? 2.6 : 2.4} />
      </span>
    </button>
  );
}
