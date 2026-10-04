import { LANGUAGES, useLanguage, useT } from '@/shared/i18n';
import { tapFeedback } from '@/shared/lib/haptics';
import styles from './LanguageButton.module.css';

export function LanguageButton() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const next = LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length];

  return (
    <button
      type="button"
      className={styles.button}
      aria-label={t.language.switchLabel}
      title={t.language.switchLabel}
      onClick={() => {
        tapFeedback();
        setLanguage(next);
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </svg>
      <span className={styles.code}>{t.language.short}</span>
    </button>
  );
}
