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

export const LOCATION_STEPS: Record<LocationPlatform, { title: string; steps: string[] }> = {
  'ios-pwa': {
    title: 'Turn on location on iPhone',
    steps: [
      'Open Settings → Privacy & Security → Location Services and make sure it is On.',
      'Scroll down to Safari Websites and choose “While Using the App”. Turn on Precise Location.',
      'Open Settings → Apps → Safari → Location and choose “Ask” or “Allow”.',
      'Come back here and tap Try again.',
      'Still nothing? iPhone remembers the choice for Home Screen apps: remove Park Radar from the Home Screen, open the site in Safari, allow location there, and add it again.',
    ],
  },
  'ios-safari': {
    title: 'Turn on location in Safari',
    steps: [
      'Tap “aA” in the address bar → Website Settings → Location → Allow.',
      'If that is greyed out: Settings → Privacy & Security → Location Services → Safari Websites → “While Using the App”.',
      'Come back here and tap Try again.',
    ],
  },
  'ios-app': {
    title: 'Turn on location for Park Radar',
    steps: ['Open Settings → Apps → Park Radar → Location.', 'Choose “While Using the App” and turn on Precise Location.', 'Come back here and tap Try again.'],
  },
  'android-app': {
    title: 'Turn on location for Park Radar',
    steps: ['Open Settings → Apps → Park Radar → Permissions → Location.', 'Choose “Allow only while using the app”.', 'Make sure Location is on in quick settings, then tap Try again.'],
  },
  'android-web': {
    title: 'Turn on location in Chrome',
    steps: [
      'Tap the icon left of the address → Permissions → Location → Allow.',
      'Make sure Location is on in quick settings and Chrome has location access (Settings → Apps → Chrome → Permissions).',
      'Come back here and tap Try again.',
    ],
  },
  desktop: {
    title: 'Turn on location in your browser',
    steps: [
      'Click the icon left of the address bar → Site settings → Location → Allow.',
      'On a Mac, also check System Settings → Privacy & Security → Location Services for your browser.',
      'Come back here and click Try again.',
    ],
  },
};
