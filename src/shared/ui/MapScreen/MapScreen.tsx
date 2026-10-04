import { IonPage } from '@ionic/react';
import { useRef, type ReactNode } from 'react';
import { useFocusOnEnter, usePageTitle } from '@/shared/navigation/usePageFocus';
import styles from './MapScreen.module.css';

export interface MapScreenProps {
  top?: ReactNode;
  side?: ReactNode;
  bottom?: ReactNode;
  children?: ReactNode;
  title?: string;
  heading?: string;
  inert?: boolean;
}

export function MapScreen({ top, side, bottom, children, title, heading, inert }: MapScreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  usePageTitle(title);
  useFocusOnEnter(ref);

  return (
    <IonPage ref={ref} className="pr-overlay-page" role="main">
      {heading && (
        <h1 className="pr-visually-hidden" tabIndex={-1}>
          {heading}
        </h1>
      )}
      <div className={styles.frame} inert={inert}>
        {top && <div className={styles.top}>{top}</div>}
        <div className={styles.spacer} />
        {side && <div className={styles.side}>{side}</div>}
        {bottom && <div className={styles.bottom}>{bottom}</div>}
      </div>
      {children}
    </IonPage>
  );
}
