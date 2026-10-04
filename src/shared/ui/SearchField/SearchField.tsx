import { forwardRef } from 'react';
import { useT } from '@/shared/i18n';
import { Icon } from '../Icon/Icon';
import styles from './SearchField.module.css';

export interface SearchTriggerProps {
  placeholder?: string;
  onClick: () => void;
  className?: string;
}

export function SearchTrigger({ placeholder, onClick, className }: SearchTriggerProps) {
  const t = useT();
  return (
    <button type="button" className={[styles.trigger, className].filter(Boolean).join(' ')} onClick={onClick}>
      <Icon name="search" size={20} color="var(--pr-ink)" />
      <span>{placeholder ?? t.search.placeholder}</span>
    </button>
  );
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onSubmit, placeholder, label, autoFocus },
  ref,
) {
  const t = useT();
  return (
    <form
      role="search"
      className={styles.field}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Icon name="search" size={20} color="var(--pr-ink)" />
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={label ?? t.search.label}
        placeholder={placeholder ?? t.search.placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
      />
      {value && (
        <button type="button" className={styles.clear} aria-label={t.search.clear} onClick={() => onChange('')}>
          <Icon name="close" size={16} strokeWidth={2.4} />
        </button>
      )}
    </form>
  );
});
