import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function tapFeedback(style: ImpactStyle = ImpactStyle.Light) {
  if (!Capacitor.isNativePlatform()) return;
  void Haptics.impact({ style }).catch(() => undefined);
}
