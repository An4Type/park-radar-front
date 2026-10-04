const VARIABLE = '--pr-attribution-height';

export function trackAttributionHeight(container: HTMLElement): () => void {
  const attribution = container.querySelector<HTMLElement>('.maplibregl-ctrl-attrib, .leaflet-control-attribution');
  if (!attribution || typeof ResizeObserver === 'undefined') return () => {};
  const root = document.documentElement;
  const observer = new ResizeObserver(() => root.style.setProperty(VARIABLE, `${Math.ceil(attribution.offsetHeight)}px`));
  observer.observe(attribution);
  return () => {
    observer.disconnect();
    root.style.removeProperty(VARIABLE);
  };
}
