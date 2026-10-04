import { appLocale, messages } from '@/shared/i18n';

export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = (meters / 1000).toLocaleString(appLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${km} km`;
}

export function formatDuration(seconds: number): string {
  const t = messages().format;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return t.minutes(minutes);
  return t.hoursMinutes(Math.floor(minutes / 60), String(minutes % 60).padStart(2, '0'));
}

export function formatArrival(seconds: number, now: Date = new Date()): string {
  return new Date(now.getTime() + seconds * 1000).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' });
}

export function formatUpdatedAgo(iso: string, now: Date = new Date(), kind: 'updated' | 'reported' = 'updated'): string {
  const t = messages().format[kind];
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutes(minutes);
  return t.hours(Math.floor(minutes / 60));
}
