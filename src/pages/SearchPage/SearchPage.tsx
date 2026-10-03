import { IonPage, useIonRouter, useIonViewDidEnter } from '@ionic/react';
import { useMemo, useRef, useState } from 'react';
import type { LatLng } from '@/api/types';
import { useUserPosition } from '@/features/location/hooks';
import { useTripStore } from '@/features/navigation/tripStore';
import { useDestinationSearch } from '@/features/search/hooks';
import type { ParkingPoint } from '@/api/types';
import { AvailabilityTag } from '@/features/parking/components/AvailabilityTag';
import { useParking } from '@/features/parking/hooks';
import { pointLevel } from '@/features/parking/lib/availability';
import { parkingForDestination } from '@/features/parking/lib/recommend';
import { formatDistance } from '@/shared/lib/format';
import { distanceMeters } from '@/shared/lib/geo';
import { tapFeedback } from '@/shared/lib/haptics';
import { paths } from '@/shared/navigation/paths';
import { useGoBack } from '@/shared/navigation/useGoBack';
import { Button, IconButton, List, ListRow, SearchInput, Skeleton } from '@/shared/ui';
import styles from './SearchPage.module.css';

const MAX_PARKING_MATCHES = 4;

interface Result {
  key: string;
  name: string;
  location: LatLng;
  parking: ParkingPoint | undefined;
  isParking: boolean;
}

export default function SearchPage() {
  const router = useIonRouter();
  const goBack = useGoBack();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { position } = useUserPosition();
  const setDestination = useTripStore((s) => s.setDestination);
  const search = useDestinationSearch(query);
  const { points } = useParking();

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
      location: d.location,
      parking: parkingForDestination(points, d.location),
      isParking: false,
    }));
    return [...parking, ...places];
  }, [points, position, search.data, search.query]);

  const open = (result: Result) => {
    if (!result.parking) return;
    tapFeedback();
    setDestination(result.isParking ? null : { name: result.name, location: result.location });
    router.push(paths.parking(result.parking.id));
  };

  return (
    <IonPage className={styles.page}>
      <header className={styles.header}>
        <IconButton icon="back" label="Back to map" variant="flat" onClick={goBack} />
        <SearchInput ref={inputRef} value={query} onChange={setQuery} />
      </header>

      <main className={styles.body} aria-busy={search.isFetching || search.isTyping}>
        {!search.query && results.length > 0 && <h2 className={styles.overline}>Suggestions</h2>}

        {search.isPending && results.length === 0 ? (
          <div className={styles.skeletons} aria-label="Loading places">
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton width="55%" height={16} />
                <Skeleton width="25%" height={12} />
              </div>
            ))}
          </div>
        ) : search.isError && results.length === 0 ? (
          <div className={styles.message}>
            <p>Couldn’t search right now.</p>
            <Button variant="text" onClick={() => void search.refetch()}>
              Try again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <p className={styles.message}>No places match “{search.query}”.</p>
        ) : (
          <List label="Places">
            {results.map((result) => (
              <ListRow
                key={result.key}
                title={result.name}
                subtitle={[
                  formatDistance(distanceMeters(position, result.location)),
                  result.isParking ? 'Parking' : result.parking && `Park at ${result.parking.name}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={
                  result.parking ? (
                    <AvailabilityTag level={pointLevel(result.parking)} />
                  ) : (
                    <span className={styles.none}>No parking</span>
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
