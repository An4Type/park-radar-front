import { en, type Messages } from './locales/en';
import { pl } from './locales/pl';
import { useLanguageStore, type Language } from './languageStore';

const DICTIONARIES: Record<Language, Messages> = { en, pl };
const LOCALES: Record<Language, string> = { en: 'en-GB', pl: 'pl-PL' };

export const currentLanguage = (): Language => useLanguageStore.getState().language;
export const messages = (): Messages => DICTIONARIES[currentLanguage()];
export const appLocale = (): string => LOCALES[currentLanguage()];

export function useT(): Messages {
  return DICTIONARIES[useLanguageStore((s) => s.language)];
}

export function useLanguage() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  return { language, setLanguage };
}

function syncDocumentLanguage(language: Language) {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}

syncDocumentLanguage(currentLanguage());
useLanguageStore.subscribe((state) => syncDocumentLanguage(state.language));

export { LANGUAGES, useLanguageStore, type Language } from './languageStore';
export type { Messages } from './locales/en';
