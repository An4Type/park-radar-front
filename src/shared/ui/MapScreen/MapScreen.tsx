import { IonPage } from '@ionic/react';
import type { ReactNode } from 'react';
import styles from './MapScreen.module.css';

export interface MapScreenProps {
  top?: ReactNode;
  side?: ReactNode;
  bottom?: ReactNode;
  children?: ReactNode;
}

export function MapScreen({ top, side, bottom, children }: MapScreenProps) {
  return (
    <IonPage className="pr-overlay-page">
      <div className={styles.frame}>
        {top && <div className={styles.top}>{top}</div>}
        <div className={styles.spacer} />
        {side && <div className={styles.side}>{side}</div>}
        {bottom && <div className={styles.bottom}>{bottom}</div>}
      </div>
      {children}
    </IonPage>
  );
}
