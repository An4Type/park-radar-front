import { Capacitor } from '@capacitor/core';
import { Geolocation, type Position } from '@capacitor/geolocation';

export interface GeoFix {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
}

export type GeoErrorKind = 'denied' | 'unavailable';

const toFix = ({ coords }: Position): GeoFix => ({
  lat: coords.latitude,
  lng: coords.longitude,
  accuracy: coords.accuracy,
  heading: coords.heading ?? null,
});

async function ensurePermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  const current = await Geolocation.checkPermissions();
  if (current.location === 'granted') return true;
  const requested = await Geolocation.requestPermissions({ permissions: ['location'] });
  return requested.location === 'granted';
}

export async function watchLocation(
  onFix: (fix: GeoFix) => void,
  onError: (kind: GeoErrorKind) => void,
): Promise<() => void> {
  try {
    if (!(await ensurePermission())) {
      onError('denied');
      return () => undefined;
    }
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
      (position, error) => {
        if (position) onFix(toFix(position));
        else if (error) onError(/denied|permission/i.test(String(error?.message ?? error)) ? 'denied' : 'unavailable');
      },
    );
    return () => void Geolocation.clearWatch({ id });
  } catch (error) {
    onError(/denied|permission/i.test(String((error as Error)?.message)) ? 'denied' : 'unavailable');
    return () => undefined;
  }
}
