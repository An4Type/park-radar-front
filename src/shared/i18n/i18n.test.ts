import { formatDistance, formatDuration, formatUpdatedAgo } from '@/shared/lib/format';
import { messages, useLanguageStore } from './index';
import { en } from './locales/en';
import { plural, pl } from './locales/pl';

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key));
}

describe('i18n', () => {
  afterEach(() => useLanguageStore.getState().setLanguage('en'));

  it('has a Polish translation for every English key', () => {
    expect(keysOf(pl).sort()).toEqual(keysOf(en).sort());
  });

  it('uses Polish plural forms', () => {
    expect([1, 2, 4, 5, 12, 22, 25].map((n) => plural(n, 'miejsce', 'miejsca', 'miejsc'))).toEqual([
      'miejsce',
      'miejsca',
      'miejsca',
      'miejsc',
      'miejsc',
      'miejsca',
      'miejsc',
    ]);
    expect(pl.home.freeNearby(3)).toBe('3 wolne w pobliżu');
    expect(pl.home.freeNearby(12)).toBe('12 wolnych w pobliżu');
  });

  it('switches messages and formatting with the language', () => {
    useLanguageStore.getState().setLanguage('pl');
    expect(messages().common.navigate).toBe('Nawiguj');
    expect(document.documentElement.lang).toBe('pl');
    expect(formatDistance(1234)).toBe('1,2 km');
    expect(formatDuration(3900)).toBe('1 godz. 05 min');
    const now = new Date('2026-10-03T12:00:00Z');
    expect(formatUpdatedAgo('2026-10-03T11:57:00Z', now)).toBe('zaktualizowano 3 min temu');
    expect(formatUpdatedAgo('2026-10-03T11:57:00Z', now, 'reported')).toBe('Zgłoszono 3 min temu');
  });

  it('formats English roundabout ordinals', () => {
    expect(en.route.roundabout(2, 'Mogilska')).toBe('At the roundabout, take the 2nd exit onto Mogilska');
    expect(en.route.roundabout(11, '')).toBe('At the roundabout, take the 11th exit');
  });
});
