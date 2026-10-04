import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/shared/lib/safeStorage';

export const LANGUAGES = ['en', 'pl'] as const;
export type Language = (typeof LANGUAGES)[number];

export function deviceLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  return preferred.some((tag) => tag?.toLowerCase().startsWith('pl')) ? 'pl' : 'en';
}

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: deviceLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'park-radar.language',
      storage: createJSONStorage(safeStorage),
      version: 1,
      partialize: (state) => ({ language: state.language }),
      merge: (persisted, current) => {
        const language = (persisted as Partial<LanguageState> | undefined)?.language;
        return LANGUAGES.includes(language as Language) ? { ...current, language: language as Language } : current;
      },
    },
  ),
);
