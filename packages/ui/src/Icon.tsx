import type { ReactNode, SVGProps } from 'react';
import { colors } from '@hof/design-tokens';

export type IconName =
  | 'home'
  | 'calendar'
  | 'users'
  | 'user'
  | 'clock'
  | 'pin'
  | 'star'
  | 'ticket'
  | 'arrowR'
  | 'arrowL'
  | 'chev'
  | 'chevDn'
  | 'plus'
  | 'minus'
  | 'close'
  | 'check'
  | 'share'
  | 'download'
  | 'wallet'
  | 'camera'
  | 'image'
  | 'flame'
  | 'search'
  | 'settings'
  | 'bell'
  | 'bolt'
  | 'music'
  | 'drop'
  | 'grid'
  | 'chat'
  | 'qr'
  | 'apple'
  | 'google'
  | 'fire'
  | 'diamond';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'color'> {
  name: IconName;
  size?: number;
  color?: string;
}

// Phosphor-style icons — regular weight, 1.5 stroke. Ported from hof-ui.jsx.
export function Icon({ name, size = 20, color = colors.textSec, ...rest }: IconProps) {
  const p = {
    stroke: color,
    strokeWidth: 1.5,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;

  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path {...p} d="M3 11 L12 4 L21 11 V20 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 Z" />
        <path {...p} d="M9 21 V14 h6 v7" />
      </>
    ),
    calendar: (
      <>
        <rect {...p} x="3" y="5" width="18" height="16" rx="2" />
        <path {...p} d="M3 10 H21 M8 3 V7 M16 3 V7" />
      </>
    ),
    users: (
      <>
        <circle {...p} cx="9" cy="9" r="3.5" />
        <path {...p} d="M3 19 a6 6 0 0 1 12 0" />
        <path {...p} d="M16 5.5 a3.5 3.5 0 0 1 0 7" />
        <path {...p} d="M18 19 a6 6 0 0 0 -3 -5.2" />
      </>
    ),
    user: (
      <>
        <circle {...p} cx="12" cy="9" r="4" />
        <path {...p} d="M4 20 a8 8 0 0 1 16 0" />
      </>
    ),
    clock: (
      <>
        <circle {...p} cx="12" cy="12" r="9" />
        <path {...p} d="M12 7 V12 L15 14" />
      </>
    ),
    pin: (
      <>
        <path {...p} d="M12 21 s-7 -7 -7 -12 a7 7 0 0 1 14 0 c0 5 -7 12 -7 12 Z" />
        <circle {...p} cx="12" cy="9" r="2.5" />
      </>
    ),
    star: (
      <path
        {...p}
        d="M12 3 L14.5 9 L21 9.5 L16 13.8 L17.5 20 L12 16.7 L6.5 20 L8 13.8 L3 9.5 L9.5 9 Z"
      />
    ),
    ticket: (
      <>
        <path
          {...p}
          d="M3 8 a2 2 0 0 1 2 -2 H19 a2 2 0 0 1 2 2 v2 a2 2 0 0 0 0 4 v2 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 v-2 a2 2 0 0 0 0 -4 Z"
        />
        <path {...p} d="M14 6 V18" strokeDasharray="2 2" />
      </>
    ),
    arrowR: <path {...p} d="M5 12 H19 M14 7 L19 12 L14 17" />,
    arrowL: <path {...p} d="M19 12 H5 M10 7 L5 12 L10 17" />,
    chev: <path {...p} d="M9 6 L15 12 L9 18" />,
    chevDn: <path {...p} d="M6 9 L12 15 L18 9" />,
    plus: <path {...p} d="M5 12 H19 M12 5 V19" />,
    minus: <path {...p} d="M5 12 H19" />,
    close: <path {...p} d="M6 6 L18 18 M18 6 L6 18" />,
    check: <path {...p} d="M5 12 L10 17 L19 7" />,
    share: (
      <>
        <circle {...p} cx="6" cy="12" r="2.5" />
        <circle {...p} cx="18" cy="6" r="2.5" />
        <circle {...p} cx="18" cy="18" r="2.5" />
        <path {...p} d="M8 11 L16 7 M8 13 L16 17" />
      </>
    ),
    download: <path {...p} d="M12 3 V15 M7 10 L12 15 L17 10 M4 20 H20" />,
    wallet: (
      <>
        <rect {...p} x="3" y="6" width="18" height="14" rx="2" />
        <path {...p} d="M3 10 H21 M16 14 H18" />
      </>
    ),
    camera: (
      <>
        <rect {...p} x="3" y="7" width="18" height="13" rx="2" />
        <circle {...p} cx="12" cy="13.5" r="3.5" />
        <path {...p} d="M8 7 L9.5 4 H14.5 L16 7" />
      </>
    ),
    image: (
      <>
        <rect {...p} x="3" y="4" width="18" height="16" rx="2" />
        <circle {...p} cx="9" cy="10" r="1.5" />
        <path {...p} d="M3 17 L9 12 L15 17 L21 13" />
      </>
    ),
    flame: (
      <path
        {...p}
        d="M12 21 c4 0 7 -3 7 -7 c0 -4 -3 -6 -4 -9 c-1 2 -3 3 -3 5 c0 -2 -1 -3 -2 -4 c-1 3 -5 5 -5 9 c0 4 3 6 7 6 Z"
      />
    ),
    search: (
      <>
        <circle {...p} cx="11" cy="11" r="7" />
        <path {...p} d="M20 20 L16 16" />
      </>
    ),
    settings: (
      <>
        <path
          {...p}
          d="M12 8 v-3 M12 19 v-3 M16 12 h3 M5 12 h3 M14.8 9.2 L17 7 M7 17 L9.2 14.8 M14.8 14.8 L17 17 M7 7 L9.2 9.2"
        />
        <circle {...p} cx="12" cy="12" r="3" />
      </>
    ),
    bell: (
      <>
        <path {...p} d="M6 17 V11 a6 6 0 0 1 12 0 V17 L20 19 H4 Z" />
        <path {...p} d="M10 21 a2 2 0 0 0 4 0" />
      </>
    ),
    bolt: <path {...p} d="M13 3 L4 14 H11 L11 21 L20 10 H13 Z" />,
    music: (
      <>
        <circle {...p} cx="6" cy="18" r="2.5" />
        <circle {...p} cx="17" cy="16" r="2.5" />
        <path {...p} d="M8.5 18 V6 L19.5 4 V16" />
      </>
    ),
    drop: <path {...p} d="M12 3 c4 5 7 8 7 12 a7 7 0 0 1 -14 0 c0 -4 3 -7 7 -12 Z" />,
    grid: (
      <>
        <rect {...p} x="3" y="3" width="7" height="7" rx="1" />
        <rect {...p} x="14" y="3" width="7" height="7" rx="1" />
        <rect {...p} x="3" y="14" width="7" height="7" rx="1" />
        <rect {...p} x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    chat: (
      <path
        {...p}
        d="M4 5 a2 2 0 0 1 2 -2 H18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H10 L5 21 V17 H6 a2 2 0 0 1 -2 -2 Z"
      />
    ),
    qr: (
      <>
        <rect {...p} x="3" y="3" width="7" height="7" />
        <rect {...p} x="14" y="3" width="7" height="7" />
        <rect {...p} x="3" y="14" width="7" height="7" />
        <path {...p} d="M14 14 H17 V17 M21 14 V17 H17 M14 17 V21 H17 M21 21 V19" />
      </>
    ),
    apple: (
      <path
        fill={color}
        d="M16.5 2 c0 1.4 -1 3 -3 3 c-.1 -1.5 1 -3 3 -3 Z M19 17 c-.5 1.3 -1.1 2.4 -2 3.2 c-.9 .9 -1.9 1.3 -3 .8 c-1.1 -.5 -1.6 -.5 -2.8 0 c-1.5 .7 -2.4 .3 -3.2 -.4 c-2.2 -1.9 -3.5 -7 -1.3 -10.4 c.9 -1.4 2.4 -2.3 4 -2.3 c1 0 1.7 .4 2.6 .4 c.7 0 1.5 -.4 2.7 -.4 c1.4 0 2.7 .6 3.6 1.8 c-3.1 1.8 -2.6 5.4 .4 7.3 Z"
      />
    ),
    google: (
      <path
        fill={color}
        d="M21.4 12.2 c0 -.7 -.1 -1.3 -.2 -2 H12 v3.8 h5.3 c-.2 1.2 -.9 2.3 -2 3 v2.5 h3.2 c1.9 -1.7 2.9 -4.3 2.9 -7.3 Z M12 21 c2.7 0 5 -.9 6.6 -2.4 l -3.2 -2.5 c-.9 .6 -2 1 -3.4 1 c-2.6 0 -4.8 -1.7 -5.6 -4.1 H3.1 v2.6 A9 9 0 0 0 12 21 Z M6.4 13 a5.3 5.3 0 0 1 0 -3.4 V7 H3.1 a9 9 0 0 0 0 8.6 L6.4 13 Z M12 6 c1.5 0 2.8 .5 3.8 1.5 l 2.8 -2.8 A9 9 0 0 0 3.1 7 l 3.3 2.6 c .8 -2.4 3 -3.6 5.6 -3.6 Z"
      />
    ),
    fire: (
      <path
        stroke={color}
        fill={color}
        fillOpacity="0.15"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M12 3 c2 4 6 6 6 11 a6 6 0 0 1 -12 0 c0 -3 2 -4 2 -7 c1 1 1.5 2 2 3 c.5 -3 1 -5 2 -7 Z"
      />
    ),
    diamond: <path {...p} d="M12 3 L21 12 L12 21 L3 12 Z" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
