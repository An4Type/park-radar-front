import type { ParkingPoint } from '@/api/types';
import { Icon, Meter } from '@/shared/ui';
import { FILLING_UP_BELOW, pointLevel } from '../lib/availability';
import { formatFee, formatParkingType } from '../lib/parkingType';
import styles from './ParkingSummary.module.css';

const LOW_CONFIDENCE = 0.8;

export interface ParkingSummaryProps {
  point: ParkingPoint;
  detail: string;
}

export function ParkingSummary({ point, detail }: ParkingSummaryProps) {
  const level = pointLevel(point);
  const fillingUp = point.active && level !== 'full' && point.free < FILLING_UP_BELOW;
  const estimated = point.active && point.confidence !== null && point.confidence < LOW_CONFIDENCE;
  const fee = formatFee(point.paid);
  const type = formatParkingType(point.kind);
  const tags = [fillingUp, fee, type, point.evChargingSpaces > 0, point.accessibleSpaces > 0, estimated].filter(Boolean);

  return (
    <div className={styles.summary}>
      <div className={styles.heading}>
        <h1 className={styles.name}>{point.name}</h1>
        <p className={styles.line} aria-live="polite">
          <b className={level === 'full' ? styles.full : styles.free}>
            {!point.active ? 'Closed' : level === 'full' ? 'Full' : `${point.free} free`}
          </b>{' '}
          of {point.capacity}
          {detail && ` · ${detail}`}
        </p>
        {point.address && <p className={styles.sub}>{point.address}</p>}
      </div>
      <Meter value={point.free} max={point.capacity} label={`${point.free} of ${point.capacity} spaces free`} />
      {tags.length > 0 && (
        <ul className={styles.chips} aria-label="Parking details">
          {fillingUp && <li className={styles.warn}>Filling up</li>}
          {fee && <li className={point.paid ? styles.chip : styles.chipFree}>{fee}</li>}
          {type && <li className={styles.chip}>{type}</li>}
          {point.evChargingSpaces > 0 && (
            <li className={styles.chip}>
              <Icon name="ev" size={14} strokeWidth={2.2} color="var(--pr-primary)" />
              {point.freeEv !== null ? `${point.freeEv}/${point.evChargingSpaces} EV free` : `${point.evChargingSpaces} EV`}
            </li>
          )}
          {point.accessibleSpaces > 0 && (
            <li className={styles.chip}>
              <Icon name="accessible" size={14} strokeWidth={2.2} color="var(--pr-primary)" />
              {point.freeAccessible !== null
                ? `${point.freeAccessible}/${point.accessibleSpaces} accessible free`
                : `${point.accessibleSpaces} accessible`}
            </li>
          )}
          {estimated && <li className={styles.chipMuted}>Estimated</li>}
        </ul>
      )}
    </div>
  );
}
