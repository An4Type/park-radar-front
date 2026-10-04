import { Marker } from 'react-map-gl/maplibre';
import type { LatLng } from '@/api/types';
import { useT } from '@/shared/i18n';
import styles from './MapMarkers.module.css';

export function UserMarker({ position, heading, navigating }: { position: LatLng; heading: number | null; navigating: boolean }) {
  const t = useT();
  return (
    <Marker
      longitude={position.lng}
      latitude={position.lat}
      anchor="center"
      rotation={navigating ? (heading ?? 0) : 0}
      rotationAlignment="map"
      style={{ zIndex: 2 }}
    >
      {navigating ? (
        <svg width="56" height="56" viewBox="0 0 56 56" aria-label={t.map.yourPosition} role="img">
          <circle cx="28" cy="28" r="26" fill="var(--pr-primary)" fillOpacity=".18" />
          <path d="M28 12 L40 40 L28 34 L16 40 Z" fill="#FFFFFF" stroke="var(--pr-primary)" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className={styles.you} role="img" aria-label={t.map.yourPosition}>
          <span className={styles.halo} />
          <span className={styles.dot} />
        </span>
      )}
    </Marker>
  );
}

export function DestinationMarker({ position, name }: { position: LatLng; name: string }) {
  const t = useT();
  return (
    <Marker longitude={position.lng} latitude={position.lat} anchor="bottom" style={{ zIndex: 3 }}>
      <svg width="34" height="44" viewBox="0 0 34 44" role="img" aria-label={t.map.destination(name)}>
        <path d="M17 43s14-14.2 14-25.5C31 8.9 24.7 3 17 3S3 8.9 3 17.5C3 28.8 17 43 17 43z" fill="var(--pr-ink)" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="17" cy="17.5" r="5" fill="#FFFFFF" />
      </svg>
    </Marker>
  );
}
