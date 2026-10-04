import { useIonRouter } from '@ionic/react';
import { useMemo } from 'react';
import type { LatLng } from '@/api/types';
import { useReports } from '@/features/reports/hooks';
import { useEscape } from '@/shared/hooks/useEscape';
import { useT } from '@/shared/i18n';
import { formatDistance } from '@/shared/lib/format';
import { distanceMeters } from '@/shared/lib/geo';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { BottomSheet, IconButton, List, ListRow } from '@/shared/ui';
import styles from '@/features/map/components/LayersSheet.module.css';
import { useVisibleParking } from '../hooks';
import { pointLevel } from '../lib/availability';
import { formatFee } from '../lib/parkingType';
import { AvailabilityTag } from './AvailabilityTag';

const MAX_PARKINGS = 25;
const MAX_REPORTS = 10;

export function ParkingListSheet({ position, onClose }: { position: LatLng; onClose: () => void }) {
  const t = useT();
  const router = useIonRouter();
  const { visiblePoints, filtered } = useVisibleParking();
  const { reports } = useReports();
  useEscape(onClose);

  const parkings = useMemo(
    () =>
      visiblePoints
        .map((point) => ({ point, distance: distanceMeters(position, point) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, MAX_PARKINGS),
    [position, visiblePoints],
  );
  const nearbyReports = useMemo(
    () =>
      reports
        .map((report) => ({ report, distance: distanceMeters(position, report) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, MAX_REPORTS),
    [position, reports],
  );

  const open = (path: string) => {
    tapFeedback();
    onClose();
    router.push(path);
  };

  return (
    <div className={styles.root}>
      <button type="button" tabIndex={-1} aria-label={t.list.close} className={styles.scrim} onClick={onClose} />
      <BottomSheet label={t.list.title} onDismiss={onClose} modal>
        <header className={styles.header}>
          <h2 className={styles.title}>{t.list.title}</h2>
          <IconButton icon="close" label={t.list.close} variant="flat" onClick={onClose} />
        </header>

        <section className={styles.section} aria-labelledby="parking-list-heading">
          <h3 id="parking-list-heading" className={styles.overline}>
            {t.list.parkings}
          </h3>
          {parkings.length === 0 ? (
            <p className={styles.hint}>{filtered ? t.list.filtered : t.list.empty}</p>
          ) : (
            <List label={t.list.parkings}>
              {parkings.map(({ point, distance }) => (
                <ListRow
                  key={point.id}
                  title={point.name}
                  subtitle={[formatDistance(distance), point.active ? t.common.free(point.free) : t.common.closed, formatFee(point.paid)]
                    .filter(Boolean)
                    .join(' · ')}
                  trailing={<AvailabilityTag level={point.active ? pointLevel(point) : 'full'} />}
                  onClick={() => open(paths.parking(point.id))}
                />
              ))}
            </List>
          )}
        </section>

        {nearbyReports.length > 0 && (
          <section className={styles.section} aria-labelledby="report-list-heading">
            <h3 id="report-list-heading" className={styles.overline}>
              {t.list.reports}
            </h3>
            <List label={t.list.reports}>
              {nearbyReports.map(({ report, distance }) => (
                <ListRow
                  key={report.id}
                  title={t.report.status[report.level]}
                  subtitle={`${formatDistance(distance)} · ${t.report.byDrivers}`}
                  onClick={() => open(paths.report(report.id))}
                />
              ))}
            </List>
          </section>
        )}
      </BottomSheet>
    </div>
  );
}
