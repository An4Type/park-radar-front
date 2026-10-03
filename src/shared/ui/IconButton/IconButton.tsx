import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

export interface IconButtonProps {
  icon: IconName;
  label: string;
  variant?: 'float' | 'active' | 'flat' | 'outline';
  pressed?: boolean;
  onClick?: () => void;
  className?: string;
}

const ICON_SIZE = { float: 22, active: 22, flat: 20, outline: 18 } as const;

export function IconButton({ icon, label, variant = 'float', pressed, onClick, className }: IconButtonProps) {
  const strokeWidth = icon === 'back' ? 2.2 : 2;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
    >
      <Icon name={icon} size={ICON_SIZE[variant]} strokeWidth={strokeWidth} />
    </button>
  );
}
