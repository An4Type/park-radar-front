export const APP_LOCALE = 'en-GB';

export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function formatArrival(seconds: number, now: Date = new Date()): string {
  return new Date(now.getTime() + seconds * 1000).toLocaleTimeString(APP_LOCALE, { hour: '2-digit', minute: '2-digit' });
}

export function formatUpdatedAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'updated just now';
  if (minutes < 60) return `updated ${minutes} min ago`;
  return `updated ${Math.floor(minutes / 60)} h ago`;
}
