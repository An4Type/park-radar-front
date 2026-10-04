import { messages } from '@/shared/i18n';

export function formatParkingType(kind: string | null): string | null {
  if (!kind) return null;
  const known = messages().parking.types[kind];
  if (known) return known;
  const words = kind.toLowerCase().split(/[_\s-]+/).filter(Boolean);
  if (!words.length) return null;
  return words.map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

export const formatFee = (paid: boolean | null): string | null =>
  paid === null ? null : paid ? messages().parking.paid : messages().parking.freeParking;
