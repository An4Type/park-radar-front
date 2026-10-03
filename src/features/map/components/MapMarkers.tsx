import { Marker } from 'react-map-gl/maplibre';
import type { LatLng } from '@/api/types';
import styles from './MapMarkers.module.css';

export function UserMarker({ position, heading, navigating }: { position: LatLng; heading: number | null; navigating: boolean }) {
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
        <svg width="56" height="56" viewBox="0 0 56 56" aria-label="Your position" role="img">
          <circle cx="28" cy="28" r="26" fill="var(--pr-primary)" fillOpacity=".18" />
          <path d="M28 12 L40 40 L28 34 L16 40 Z" fill="#FFFFFF" stroke="var(--pr-primary)" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className={styles.you} role="img" aria-label="Your position">
          <span className={styles.halo} />
          <span className={styles.dot} />
        </span>
      )}
    </Marker>
  );
}
