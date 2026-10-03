import { IconButton, OptionMenu } from '@/shared/ui';
import { LAYER_OPTIONS, useMapStore } from '../mapStore';
import styles from './LayersControl.module.css';

export interface LayersControlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LayersControl({ open, onOpenChange }: LayersControlProps) {
  const layerMode = useMapStore((s) => s.layerMode);
  const setLayerMode = useMapStore((s) => s.setLayerMode);

  return (
    <div className={styles.anchor}>
      {open && (
        <OptionMenu
          className={styles.menu}
          title="Show availability as"
          options={LAYER_OPTIONS}
          value={layerMode}
          onSelect={(mode) => {
            setLayerMode(mode);
            onOpenChange(false);
          }}
          onClose={() => onOpenChange(false)}
        />
      )}
      <IconButton
        icon="layers"
        label={open ? 'Close map layers' : 'Map layers'}
        variant={open ? 'active' : 'float'}
        pressed={open}
        onClick={() => onOpenChange(!open)}
      />
    </div>
  );
}

export function LayersScrim({ onClose }: { onClose: () => void }) {
  return <button type="button" tabIndex={-1} aria-label="Close layers" className={styles.scrim} onClick={onClose} />;
}
