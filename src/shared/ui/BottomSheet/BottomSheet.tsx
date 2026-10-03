import { createGesture } from '@ionic/react';
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  children: ReactNode;
  onDismiss?: () => void;
  label?: string;
}

const DISMISS_FRACTION = 0.35;
const DISMISS_VELOCITY = 0.45;

export function BottomSheet({ children, onDismiss, label }: BottomSheetProps) {
  const ref = useRef<HTMLElement>(null);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const gesture = createGesture({
      el,
      gestureName: 'pr-bottom-sheet',
      direction: 'y',
      threshold: 8,
      onStart: () => {
        el.style.transition = 'none';
      },
      onMove: ({ deltaY }) => {
        const offset = deltaY < 0 ? deltaY * 0.15 : deltaY;
        el.style.transform = `translateY(${offset}px)`;
      },
      onEnd: ({ deltaY, velocityY }) => {
        el.style.transition = '';
        const shouldDismiss =
          onDismissRef.current && (deltaY > el.offsetHeight * DISMISS_FRACTION || velocityY > DISMISS_VELOCITY);
        if (shouldDismiss) {
          el.style.transform = 'translateY(110%)';
          window.setTimeout(() => onDismissRef.current?.(), 180);
        } else {
          el.style.transform = '';
        }
      },
    });
    gesture.enable();
    return () => gesture.destroy();
  }, []);

  return (
    <section ref={ref} className={styles.sheet} aria-label={label}>
      <div className={styles.grip} aria-hidden="true" />
      {children}
    </section>
  );
}
