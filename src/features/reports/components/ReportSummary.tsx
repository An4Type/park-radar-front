import type { ParkingReport } from '@/api/types';
import { useT } from '@/shared/i18n';
import { formatDuration, formatUpdatedAgo } from '@/shared/lib/format';
import { Icon, Skeleton } from '@/shared/ui';
import { useAddress } from '../hooks';
import styles from './ReportSummary.module.css';

export function ReportSummary({ report, now = new Date() }: { report: ParkingReport; now?: Date }) {
  const t = useT();
  const address = useAddress(report);
  const reported = report.createdAt ? formatUpdatedAgo(report.createdAt, now, 'reported') : null;
  const expiresIn = report.expiresAt ? (Date.parse(report.expiresAt) - now.getTime()) / 1000 : null;
  const timing = [reported, expiresIn !== null && expiresIn > 0 ? t.report.expiresIn(formatDuration(expiresIn)) : null].filter(Boolean).join(' · ');

  return (
    <div className={styles.summary}>
      <span className={styles.overline}>
        <Icon name="report" size={14} />
        {t.report.byDrivers}
      </span>
      <h1 className={styles.address} tabIndex={-1}>
        {address.isPending ? <Skeleton width="70%" height={24} /> : address.data || t.common.reportedSpot}
      </h1>
      <p className={styles.line} aria-live="polite">
        <span className={[styles.tag, styles[report.level]].join(' ')}>{t.report.status[report.level]}</span>
        {timing && <span className={styles.meta}>{timing}</span>}
      </p>
      <p className={styles.note}>{t.report.note}</p>
    </div>
  );
}
