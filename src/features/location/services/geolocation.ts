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

const PERMISSION_DENIED = 1;

function errorKind(error: unknown): GeoErrorKind {
  const code = (error as { code?: number } | null)?.code;
  if (code === PERMISSION_DENIED) return 'denied';
  return /denied|permission/i.test(String((error as Error)?.message ?? error)) ? 'denied' : 'unavailable';
}

export async function isBlockedInBrowser(): Promise<boolean> {
  if (Capacitor.isNativePlatform() || typeof navigator === 'undefined' || !navigator.permissions) return false;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state === 'denied';
  } catch {
    return false;
  }
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
    if (!Capacitor.isNativePlatform()) {
      Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 })
        .then((position) => onFix(toFix(position)))
        .catch((error) => onError(errorKind(error)));
    }
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 5_000 },
      (position, error) => {
        if (position) onFix(toFix(position));
        else if (error) onError(errorKind(error));
      },
    );
    return () => void Geolocation.clearWatch({ id });
  } catch (error) {
    onError(errorKind(error));
    return () => undefined;
  }
}

export function requestLocationNow(): Promise<GeoFix> {
  if (Capacitor.isNativePlatform()) {
    return Geolocation.requestPermissions({ permissions: ['location'] })
      .then((status) => {
        if (status.location !== 'granted') throw Object.assign(new Error('denied'), { code: PERMISSION_DENIED });
        return Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 0 });
      })
      .then(toFix);
  }
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? null,
        }),
      reject,
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 0 },
    );
  });
}

export const geoErrorKind = errorKind;
