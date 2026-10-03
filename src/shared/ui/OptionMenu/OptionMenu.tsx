import { useEffect, useRef } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './OptionMenu.module.css';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export interface OptionMenuProps<T extends string> {
  title: string;
  options: ReadonlyArray<Option<T>>;
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  className?: string;
}

export function OptionMenu<T extends string>({ title, options, value, onSelect, onClose, className }: OptionMenuProps<T>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={title}
      className={[styles.menu, className].filter(Boolean).join(' ')}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <span className={styles.title} aria-hidden="true">
        {title}
      </span>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            className={[styles.item, selected && styles.selected].filter(Boolean).join(' ')}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
            {selected && <Icon name="check" size={18} strokeWidth={2.6} color="var(--pr-primary)" />}
          </button>
        );
      })}
    </div>
  );
}
