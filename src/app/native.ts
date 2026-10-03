import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useIonRouter } from '@ionic/react';
import { useEffect } from 'react';

export async function setupNativeChrome() {
  if (!Capacitor.isNativePlatform()) return;
  await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
  if (Capacitor.getPlatform() === 'android') {
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
  }
}

export function useAndroidBackExit() {
  const router = useIonRouter();
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    const onBack = (event: Event) => {
      (event as CustomEvent<{ register: (priority: number, handler: () => void) => void }>).detail.register(-1, () => {
        if (!router.canGoBack()) void App.exitApp();
      });
    };
    document.addEventListener('ionBackButton', onBack);
    return () => document.removeEventListener('ionBackButton', onBack);
  }, [router]);
}
