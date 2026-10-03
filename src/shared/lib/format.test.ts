import { formatDistance, formatDuration, formatUpdatedAgo } from './format';

describe('format', () => {
  it('formats distances like the UI kit', () => {
    expect(formatDistance(248)).toBe('250 m');
    expect(formatDistance(1234)).toBe('1.2 km');
  });

  it('formats durations in minutes, never 0', () => {
    expect(formatDuration(10)).toBe('1 min');
    expect(formatDuration(180)).toBe('3 min');
    expect(formatDuration(3900)).toBe('1 h 05 min');
  });

  it('formats freshness', () => {
    const now = new Date('2026-10-03T12:00:00Z');
    expect(formatUpdatedAgo('2026-10-03T11:59:40Z', now)).toBe('updated just now');
    expect(formatUpdatedAgo('2026-10-03T11:57:00Z', now)).toBe('updated 3 min ago');
  });
});
