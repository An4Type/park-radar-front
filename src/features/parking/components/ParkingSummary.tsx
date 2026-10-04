import type { ParkingPoint } from '@/api/types';
import { useT } from '@/shared/i18n';
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
  const t = useT();
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
            {!point.active ? t.common.closed : level === 'full' ? t.common.full : t.common.free(point.free)}
          </b>{' '}
          {t.parking.ofCapacity(point.capacity)}
          {detail && ` · ${detail}`}
        </p>
        {point.address && <p className={styles.sub}>{point.address}</p>}
      </div>
      <Meter value={point.free} max={point.capacity} label={t.parking.meter(point.free, point.capacity)} />
      {tags.length > 0 && (
        <ul className={styles.chips} aria-label={t.parking.details}>
          {fillingUp && <li className={styles.warn}>{t.parking.fillingUp}</li>}
          {fee && <li className={point.paid ? styles.chip : styles.chipFree}>{fee}</li>}
          {type && <li className={styles.chip}>{type}</li>}
          {point.evChargingSpaces > 0 && (
            <li className={styles.chip}>
              <Icon name="ev" size={14} strokeWidth={2.2} color="var(--pr-primary)" />
              {point.freeEv !== null ? t.parking.evFree(point.freeEv, point.evChargingSpaces) : t.parking.evTotal(point.evChargingSpaces)}
            </li>
          )}
          {point.accessibleSpaces > 0 && (
            <li className={styles.chip}>
              <Icon name="accessible" size={14} strokeWidth={2.2} color="var(--pr-primary)" />
              {point.freeAccessible !== null
                ? t.parking.accessibleFree(point.freeAccessible, point.accessibleSpaces)
                : t.parking.accessibleTotal(point.accessibleSpaces)}
            </li>
          )}
          {estimated && <li className={styles.chipMuted}>{t.parking.estimated}</li>}
        </ul>
      )}
    </div>
  );
}
