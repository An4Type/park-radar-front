import { useIonRouter } from '@ionic/react';
import { ImpactStyle } from '@capacitor/haptics';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useMapCamera } from '@/features/map/hooks/useMapCamera';
import { useActiveRoute } from '@/features/navigation/hooks';
import { useTripStore } from '@/features/navigation/tripStore';
import { hexPoints } from '@/features/parking/lib/hexIndex';
import { ReportSummary } from '@/features/reports/components/ReportSummary';
import { useReport } from '@/features/reports/hooks';
import { formatDistance, formatDuration } from '@/shared/lib/format';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { useGoBack } from '@/shared/navigation/useGoBack';
import { ActionBadge, BottomSheet, Button, IconButton, MapScreen, Skeleton } from '@/shared/ui';
import styles from './ReportPage.module.css';

const SHEET_PADDING = { top: 110, bottom: 380, left: 48, right: 48 };

export default function ReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const goBack = useGoBack();
  const camera = useMapCamera();
  const router = useIonRouter();
  const startNavigation = useTripStore((s) => s.startNavigation);
  const { report, isPending } = useReport(reportId);
  const route = useActiveRoute(report);

  const framed = useRef<string>(undefined);
  useEffect(() => {
    if (!report || framed.current === report.id) return;
    if (camera.fitTo(hexPoints(report), SHEET_PADDING, 17)) framed.current = report.id;
  }, [camera, report]);

  return (
    <MapScreen top={<IconButton icon="back" label="Back to map" onClick={goBack} className={styles.back} />}>
      <BottomSheet label="Driver report" onDismiss={goBack}>
        {report ? (
          <>
            <ReportSummary report={report} />
            <ActionBadge
              title="Navigate"
              subtitle={
                route.data
                  ? `${formatDuration(route.data.durationSeconds)} · ${formatDistance(route.data.distanceMeters)}`
                  : route.isError
                    ? 'Route unavailable'
                    : 'Finding route…'
              }
              icon="navigate"
              onClick={() => {
                tapFeedback(ImpactStyle.Medium);
                startNavigation(route.origin);
                router.push(paths.navigateReport(report.id));
              }}
            />
          </>
        ) : isPending ? (
          <div className={styles.loading} aria-busy="true" aria-label="Loading report">
            <Skeleton width="40%" height={12} />
            <Skeleton width="70%" height={24} />
            <Skeleton width="55%" height={28} radius={14} />
          </div>
        ) : (
          <div className={styles.loading}>
            <h1 className={styles.title}>This report has expired</h1>
            <Button variant="secondary" block onClick={goBack}>
              Back to map
            </Button>
          </div>
        )}
      </BottomSheet>
    </MapScreen>
  );
}
