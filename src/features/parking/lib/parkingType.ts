const KNOWN: Record<string, string> = {
  OUTDOOR: 'Outdoor',
  UNDERGROUND: 'Underground',
  MULTI_LEVEL: 'Multi-level',
  MULTI_STOREY: 'Multi-storey',
  MULTILEVEL: 'Multi-level',
  INDOOR: 'Indoor',
  GARAGE: 'Garage',
  STREET: 'Street',
  ON_STREET: 'Street',
};

export function formatParkingType(kind: string | null): string | null {
  if (!kind) return null;
  if (KNOWN[kind]) return KNOWN[kind];
  const words = kind.toLowerCase().split(/[_\s-]+/).filter(Boolean);
  if (!words.length) return null;
  return words.map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

export const formatFee = (paid: boolean | null): string | null => (paid === null ? null : paid ? 'Paid' : 'Free parking');
