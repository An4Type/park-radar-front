import { useEffect, useState } from 'react';
import type { LatLng } from '@/api/types';
import { env } from '@/config/env';
import { useLocationStore } from './locationStore';
import { isBlockedInBrowser, watchLocation, type GeoErrorKind } from './services/geolocation';

export function useLocationTracking() {
  const setFix = useLocationStore((s) => s.setFix);
  const setStatus = useLocationStore((s) => s.setStatus);
  const setError = useLocationStore((s) => s.setError);
  const attempt = useLocationStore((s) => s.attempt);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    setStatus('locating');
    const onError = (kind: GeoErrorKind) => {
      if (kind !== 'denied') return setError(kind);
      void isBlockedInBrowser().then((blocked) => !cancelled && setError(kind, blocked));
    };
    void watchLocation(setFix, onError).then((unsubscribe) => {
      if (cancelled) unsubscribe();
      else stop = unsubscribe;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [attempt, setError, setFix, setStatus]);
}

export function useUserPosition(): { position: LatLng; isFallback: boolean } {
  const position = useLocationStore((s) => s.position);
  return position ? { position, isFallback: false } : { position: env.defaultCenter, isFallback: true };
}

export function useFrozenPosition(): LatLng {
  const { position, isFallback } = useUserPosition();
  const [frozen, setFrozen] = useState({ value: position, real: !isFallback });

  useEffect(() => {
    if (!frozen.real && !isFallback) setFrozen({ value: position, real: true });
  }, [frozen.real, isFallback, position]);

  return frozen.value;
}
