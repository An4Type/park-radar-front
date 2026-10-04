import { IonPage, useIonRouter, useIonViewDidEnter } from '@ionic/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LatLng } from '@/api/types';
import { useUserPosition } from '@/features/location/hooks';
import { useTripStore } from '@/features/navigation/tripStore';
import { useDestinationSearch } from '@/features/search/hooks';
import type { ParkingPoint } from '@/api/types';
import { AvailabilityTag } from '@/features/parking/components/AvailabilityTag';
import { useParking } from '@/features/parking/hooks';
import { pointLevel } from '@/features/parking/lib/availability';
import { parkingForDestination } from '@/features/parking/lib/recommend';
import { useT } from '@/shared/i18n';
import { formatDistance } from '@/shared/lib/format';
import { distanceMeters } from '@/shared/lib/geo';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { useGoBack } from '@/shared/navigation/useGoBack';
import { Button, Icon, IconButton, List, ListRow, SearchInput, Skeleton } from '@/shared/ui';
import styles from './SearchPage.module.css';

const MAX_PARKING_MATCHES = 4;

interface Result {
  key: string;
  name: string;
  detail?: string;
  location: LatLng;
  parking: ParkingPoint | undefined;
  isParking: boolean;
}

export interface ShowcaseLiveLocationRequest {
  id: string;
  query: string;
}

interface SearchPageProps {
  showcaseLiveLocationRequest?: ShowcaseLiveLocationRequest | null;
  onShowcaseLiveLocationComplete?: (requestId: string, selected: boolean) => void;
}

export default function SearchPage({
  showcaseLiveLocationRequest,
  onShowcaseLiveLocationComplete,
}: SearchPageProps) {
  const router = useIonRouter();
  const goBack = useGoBack();
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { position } = useUserPosition();
  const setDestination = useTripStore((s) => s.setDestination);
  const search = useDestinationSearch(query);
  const { points } = useParking();
  const latestResults = useRef<Result[]>([]);
  const latestSearchQuery = useRef('');

  useIonViewDidEnter(() => inputRef.current?.focus());

  const results = useMemo<Result[]>(() => {
    const needle = search.query.toLowerCase();
    const parking: Result[] = needle
      ? points
          .filter((p) => `${p.name} ${p.address}`.toLowerCase().includes(needle))
          .sort((a, b) => distanceMeters(position, a) - distanceMeters(position, b))
          .slice(0, MAX_PARKING_MATCHES)
          .map((p) => ({ key: p.id, name: p.name, location: p, parking: p, isParking: true }))
      : [];
    const places: Result[] = (search.data ?? []).map((d) => ({
      key: d.id,
      name: d.name,
      detail: d.detail,
      location: d.location,
      parking: parkingForDestination(points, d.location),
      isParking: false,
    }));
    return [...parking, ...places];
  }, [points, position, search.data, search.query]);

  const open = useCallback((result: Result) => {
    tapFeedback();
    if (result.isParking && result.parking) {
      setDestination(null);
      router.push(paths.parking(result.parking.id));
      return;
    }
    setDestination({ name: result.name, detail: result.detail, location: result.location });
    router.push(paths.place);
  }, [router, setDestination]);

  useEffect(() => {
    latestResults.current = results;
    latestSearchQuery.current = search.query;
  }, [results, search.query]);

  useEffect(() => {
    if (!showcaseLiveLocationRequest) return;
    setQuery(showcaseLiveLocationRequest.query);

    const timeout = window.setTimeout(() => {
      const matchesCommand = latestSearchQuery.current.toLowerCase() === showcaseLiveLocationRequest.query.toLowerCase();
      const firstOption = matchesCommand ? latestResults.current[0] : undefined;
      if (firstOption) open(firstOption);
      onShowcaseLiveLocationComplete?.(showcaseLiveLocationRequest.id, Boolean(firstOption));
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [onShowcaseLiveLocationComplete, open, showcaseLiveLocationRequest]);

  return (
    <IonPage className={styles.page}>
      <header className={styles.header}>
        <IconButton icon="back" label={t.common.backToMap} variant="flat" onClick={goBack} />
        <SearchInput ref={inputRef} value={query} onChange={setQuery} />
      </header>

      <main className={styles.body} aria-busy={search.isFetching || search.isTyping}>
        {!search.query && results.length > 0 && <h2 className={styles.overline}>{t.search.suggestions}</h2>}

        {search.isPending && results.length === 0 ? (
          <div className={styles.skeletons} aria-label={t.search.loading}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="25%" height={12} />
              </div>
            ))}
          </div>
        ) : search.isError && results.length === 0 ? (
          <div className={styles.message}>
            <p>{t.search.failed}</p>
            <Button variant="text" onClick={() => void search.refetch()}>
              {t.common.tryAgain}
            </Button>
          </div>
        ) : results.length === 0 ? (
          <p className={styles.message}>{t.search.noMatch(search.query)}</p>
        ) : (
          <List label={t.search.places}>
            {results.map((result) => (
              <ListRow
                key={result.key}
                title={result.name}
                subtitle={[
                  formatDistance(distanceMeters(position, result.location)),
                  result.isParking ? t.common.parking : result.detail,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={
                  result.parking ? (
                    <AvailabilityTag level={pointLevel(result.parking)} />
                  ) : result.isParking ? (
                    <span className={styles.none}>{t.search.noParking}</span>
                  ) : (
                    <Icon name="arrow" size={18} color="var(--pr-muted)" />
                  )
                }
                onClick={() => open(result)}
              />
            ))}
          </List>
        )}
      </main>
    </IonPage>
  );
}
