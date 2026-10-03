import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  block?: boolean;
}

export function Button({ variant = 'primary', block, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], block && styles.block, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
