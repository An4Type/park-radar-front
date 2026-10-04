import type { ReportLevel } from '@/api/types';

export const REPORT_LEVELS: ReadonlyArray<{ value: ReportLevel; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No free spaces' },
  { value: 'few', label: 'Few', description: 'A couple of spaces' },
  { value: 'many', label: 'Many', description: 'Plenty of spaces' },
];

export const REPORT_LABEL: Record<ReportLevel, string> = { none: 'No free spaces', few: 'Few free', many: 'Many free' };
