import type { Maneuver } from '@/api/types';
import { Icon, type IconName, Skeleton } from '@/shared/ui';
import styles from './InstructionCard.module.css';

const MANEUVER_ICON: Record<Maneuver, IconName> = {
  depart: 'straight',
  straight: 'straight',
  'slight-left': 'slightLeft',
  'slight-right': 'slightRight',
  'turn-left': 'turnLeft',
  'turn-right': 'turnRight',
  uturn: 'uturn',
  roundabout: 'roundabout',
  arrive: 'place',
};

export interface InstructionCardProps {
  maneuver?: Maneuver;
  distance?: string;
  instruction?: string;
}

export function InstructionCard({ maneuver, distance, instruction }: InstructionCardProps) {
  const loading = !maneuver;
  return (
    <div className={styles.card} aria-busy={loading}>
      <span className={styles.maneuver}>
        {maneuver && <Icon name={MANEUVER_ICON[maneuver]} size={24} strokeWidth={2.4} />}
      </span>
      <div className={styles.text}>
        {loading ? (
          <>
            <Skeleton width={80} height={22} />
            <Skeleton width={180} height={14} />
          </>
        ) : (
          <>
            <span className={styles.distance}>{distance}</span>
            <span className={styles.instruction} aria-hidden="true">
              {instruction}
            </span>
          </>
        )}
      </div>
      <span className="pr-visually-hidden" role="status">
        {loading ? '' : instruction}
      </span>
    </div>
  );
}
