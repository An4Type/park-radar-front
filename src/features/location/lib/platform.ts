import { Capacitor } from '@capacitor/core';

export type LocationPlatform = 'ios-app' | 'ios-pwa' | 'ios-safari' | 'android-app' | 'android-web' | 'desktop';

export function detectPlatform(): LocationPlatform {
  if (Capacitor.isNativePlatform()) return Capacitor.getPlatform() === 'ios' ? 'ios-app' : 'android-app';
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) {
    const standalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches;
    return standalone ? 'ios-pwa' : 'ios-safari';
  }
  if (/Android/.test(ua)) return 'android-web';
  return 'desktop';
}
