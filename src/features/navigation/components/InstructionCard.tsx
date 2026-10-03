import type { Maneuver } from '@/api/types';
import { Icon, type IconName, Skeleton } from '@/shared/ui';
import styles from './InstructionCard.module.css';

const MANEUVER_ICON: Record<Maneuver, IconName> = {
  depart: 'straight',
  straight: 'straight',
  'turn-left': 'turnLeft',
  'turn-right': 'turnRight',
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
    <div className={styles.card} role="status" aria-live="polite" aria-busy={loading}>
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
            <span className={styles.instruction}>{instruction}</span>
          </>
        )}
      </div>
    </div>
  );
}
