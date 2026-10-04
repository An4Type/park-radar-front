import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import type { MapStyleImageMissingEvent } from 'maplibre-gl';
import { addAllMapImages, addMapImage } from '../lib/mapImages';

export function MapImages({ onReady }: { onReady: () => void }) {
  const { current } = useMap();

  useEffect(() => {
    const map = current?.getMap();
    if (!map) return;
    const onMissing = (event: MapStyleImageMissingEvent) => addMapImage(map, event.id);
    map.on('styleimagemissing', onMissing);
    const register = () => {
      addAllMapImages(map);
      onReady();
    };
    if (map.isStyleLoaded()) register();
    else map.once('load', register);
    return () => {
      map.off('styleimagemissing', onMissing);
    };
  }, [current, onReady]);

  return null;
}
