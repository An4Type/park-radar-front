import { useIonRouter } from '@ionic/react';
import { useCallback } from 'react';
import { paths } from './paths';

export function useGoBack(fallback: string = paths.home) {
  const router = useIonRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.goBack();
    else router.push(fallback, 'back', 'replace');
  }, [router, fallback]);
}
