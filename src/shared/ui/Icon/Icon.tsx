import type { CSSProperties } from 'react';

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </>
  ),
  navigate: <path d="M3 11l18-8-8 18-2-8-8-2z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12l5 5 9-10" />,
  ev: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  place: (
    <>
      <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  recent: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  info: (
    <>
      <path d="M12 3v3M12 18v3M4 12H3M21 12h-1" />
      <circle cx="12" cy="12" r="5" />
    </>
  ),
  turnRight: <path d="M8 20V10h10M14 6l4 4-4 4" />,
  turnLeft: <path d="M16 20V10H6M10 6l-4 4 4 4" />,
  straight: <path d="M12 20V5M6 11l6-6 6 6" />,
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 24, strokeWidth = 2, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flex: 'none', color, ...style }}
    >
      {ICONS[name]}
    </svg>
  );
}
