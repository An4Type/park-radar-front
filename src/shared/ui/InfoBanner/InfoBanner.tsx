import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './InfoBanner.module.css';

export interface InfoBannerProps {
  children: ReactNode;
  icon?: IconName;
  tone?: 'neutral' | 'warning';
  action?: ReactNode;
  hint?: ReactNode;
  onClick?: () => void;
}

export function InfoBanner({ children, icon = 'info', tone = 'neutral', action, hint, onClick }: InfoBannerProps) {
  const className = [styles.banner, styles[tone], onClick && styles.clickable].filter(Boolean).join(' ');
  const content = (
    <>
      <Icon name={icon} size={22} />
      <span className={styles.text}>
        {children}
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      {onClick ? <Icon name="arrow" size={18} className={styles.chevron} /> : action}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }
  return (
    <div className={className} role="status">
      {content}
    </div>
  );
}
