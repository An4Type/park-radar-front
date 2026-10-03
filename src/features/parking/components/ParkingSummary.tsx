import type { ParkingPoint } from '@/api/types';
import { Meter } from '@/shared/ui';
import { FILLING_UP_BELOW, pointLevel } from '../lib/availability';
import styles from './ParkingSummary.module.css';

const LOW_CONFIDENCE = 0.8;

export interface ParkingSummaryProps {
  point: ParkingPoint;
  detail: string;
}

export function ParkingSummary({ point, detail }: ParkingSummaryProps) {
  const level = pointLevel(point);
  const fillingUp = point.active && level !== 'full' && point.free < FILLING_UP_BELOW;
  const estimated = point.active && point.confidence < LOW_CONFIDENCE;

  return (
    <div className={styles.summary}>
      <div className={styles.heading}>
        <h1 className={styles.name}>{point.name}</h1>
        <p className={styles.line} aria-live="polite">
          <b className={level === 'full' ? styles.full : styles.free}>
            {!point.active ? 'Closed' : level === 'full' ? 'Full' : `${point.free} free`}
          </b>{' '}
          of {point.capacity} · {detail}
        </p>
        {point.address && <p className={styles.sub}>{point.address}</p>}
      </div>
      <Meter value={point.free} max={point.capacity} label={`${point.free} of ${point.capacity} spaces free`} />
      {(fillingUp || estimated) && (
        <div className={styles.chips}>
          {fillingUp && <span className={styles.warn}>Filling up</span>}
          {estimated && <span className={styles.chip}>Estimated</span>}
        </div>
      )}
    </div>
  );
}
