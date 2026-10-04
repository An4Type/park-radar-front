import { useIonViewDidEnter, useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react';
import { useEffect, useRef, type RefObject } from 'react';

const APP_NAME = 'Park Radar';
const FOCUS_TARGETS = ['[data-page-focus]', 'h1', 'section[tabindex="-1"]'];

let firstScreen = true;

function applyTitle(title: string | undefined) {
  document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
}

export function usePageTitle(title: string | undefined) {
  const latest = useRef(title);
  const active = useRef(false);

  useEffect(() => {
    latest.current = title;
    if (active.current) applyTitle(title);
  }, [title]);

  useIonViewWillEnter(() => {
    active.current = true;
    applyTitle(latest.current);
  });

  useIonViewWillLeave(() => {
    active.current = false;
  });
}

export function useFocusOnEnter(ref: RefObject<HTMLElement | null>) {
  useIonViewDidEnter(() => {
    if (firstScreen) {
      firstScreen = false;
      return;
    }
    const root = ref.current;
    const target = FOCUS_TARGETS.map((selector) => root?.querySelector<HTMLElement>(selector)).find(Boolean);
    if (target && !target.contains(document.activeElement)) target.focus({ preventScroll: true });
  });
}
