import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './InfoBanner.module.css';

export interface InfoBannerProps {
  children: ReactNode;
  icon?: IconName;
  tone?: 'neutral' | 'warning';
  action?: ReactNode;
}

export function InfoBanner({ children, icon = 'info', tone = 'neutral', action }: InfoBannerProps) {
  return (
    <div className={[styles.banner, styles[tone]].join(' ')} role="status">
      <Icon name={icon} size={22} />
      <span className={styles.text}>{children}</span>
      {action}
    </div>
  );
}
