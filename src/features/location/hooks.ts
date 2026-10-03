import { useEffect, useState } from 'react';
import type { LatLng } from '@/api/types';
import { env } from '@/config/env';
import { useLocationStore } from './locationStore';
import { watchLocation } from './services/geolocation';

export function useLocationTracking() {
  const setFix = useLocationStore((s) => s.setFix);
  const setStatus = useLocationStore((s) => s.setStatus);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    setStatus('locating');
    void watchLocation(setFix, setStatus).then((unsubscribe) => {
      if (cancelled) unsubscribe();
      else stop = unsubscribe;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [setFix, setStatus]);
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
