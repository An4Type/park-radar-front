import type { ParkingReport } from '@/api/types';
import { formatDuration, formatUpdatedAgo } from '@/shared/lib/format';
import { Icon, Skeleton } from '@/shared/ui';
import { useAddress } from '../hooks';
import { REPORT_LABEL } from '../lib/levels';
import styles from './ReportSummary.module.css';

export function ReportSummary({ report, now = new Date() }: { report: ParkingReport; now?: Date }) {
  const address = useAddress(report);
  const reported = report.createdAt ? formatUpdatedAgo(report.createdAt, now).replace('updated', 'Reported') : null;
  const expiresIn = report.expiresAt ? (Date.parse(report.expiresAt) - now.getTime()) / 1000 : null;
  const timing = [reported, expiresIn !== null && expiresIn > 0 ? `expires in ${formatDuration(expiresIn)}` : null].filter(Boolean).join(' · ');

  return (
    <div className={styles.summary}>
      <span className={styles.overline}>
        <Icon name="report" size={14} />
        Reported by drivers
      </span>
      <h1 className={styles.address}>
        {address.isPending ? <Skeleton width="70%" height={24} /> : address.data || 'Reported spot'}
      </h1>
      <p className={styles.line} aria-live="polite">
        <span className={[styles.tag, styles[report.level]].join(' ')}>{REPORT_LABEL[report.level]}</span>
        {timing && <span className={styles.meta}>{timing}</span>}
      </p>
      <p className={styles.note}>No sensors here: this is what a driver nearby told us.</p>
    </div>
  );
}
