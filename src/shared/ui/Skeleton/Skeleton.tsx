import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({ width = '100%', height = 16, radius = 8, tone = 'light' }: {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: number;
  tone?: 'light' | 'onPrimary';
}) {
  return (
    <span
      aria-hidden="true"
      className={[styles.skeleton, styles[tone]].join(' ')}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
