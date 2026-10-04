import { createGesture } from '@ionic/react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  children: ReactNode;
  onDismiss?: () => void;
  label?: string;
  modal?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function trapTab(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

const DISMISS_FRACTION = 0.35;
const DISMISS_VELOCITY = 0.45;

export function BottomSheet({ children, onDismiss, label, modal }: BottomSheetProps) {
  const ref = useRef<HTMLElement>(null);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const [opener] = useState(() => (modal ? (document.activeElement as HTMLElement | null) : null));

  useEffect(() => {
    if (!modal) return;
    const frame = requestAnimationFrame(() => {
      const el = ref.current;
      if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [modal, opener]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const gesture = createGesture({
      el,
      gestureName: 'pr-bottom-sheet',
      direction: 'y',
      threshold: 8,
      canStart: ({ deltaY }) => el.scrollTop <= 0 && (deltaY > 0 || el.scrollHeight <= el.clientHeight),
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
    <section
      ref={ref}
      className={styles.sheet}
      aria-label={label}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      tabIndex={-1}
      onKeyDown={modal ? trapTab : undefined}
    >
      <div className={styles.grip} aria-hidden="true" />
      {children}
    </section>
  );
}
