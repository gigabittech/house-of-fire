interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = 'var(--hof-text-sec)' }: IconProps) {
  const s = size;
  const p: React.SVGAttributes<SVGElement> & { stroke: string } = {
    stroke: color,
    strokeWidth: 1.5,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths: Record<string, React.ReactNode> = {
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
    qr: (
      <>
        <rect {...p} x="3" y="3" width="7" height="7" />
        <rect {...p} x="14" y="3" width="7" height="7" />
        <rect {...p} x="3" y="14" width="7" height="7" />
        <path {...p} d="M14 14 H17 V17 M21 14 V17 H17 M14 17 V21 H17 M21 21 V19" />
      </>
    ),
    image: (
      <>
        <rect {...p} x="3" y="4" width="18" height="16" rx="2" />
        <circle {...p} cx="9" cy="10" r="1.5" />
        <path {...p} d="M3 17 L9 12 L15 17 L21 13" />
      </>
    ),
    flag: (
      <>
        <path {...p} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line {...p} x1="4" y1="22" x2="4" y2="15" />
      </>
    ),
    bell: (
      <>
        <path {...p} d="M6 17 V11 a6 6 0 0 1 12 0 V17 L20 19 H4 Z" />
        <path {...p} d="M10 21 a2 2 0 0 0 4 0" />
      </>
    ),
    tag: (
      <>
        <path
          {...p}
          d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        />
        <line {...p} x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
    wallet: (
      <>
        <rect {...p} x="3" y="6" width="18" height="14" rx="2" />
        <path {...p} d="M3 10 H21 M16 14 H18" />
      </>
    ),
    chart: (
      <>
        <polyline {...p} points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </>
    ),
    search: (
      <>
        <circle {...p} cx="11" cy="11" r="7" />
        <path {...p} d="M20 20 L16 16" />
      </>
    ),
    plus: (
      <>
        <path {...p} d="M5 12 H19 M12 5 V19" />
      </>
    ),
    minus: (
      <>
        <path {...p} d="M5 12 H19" />
      </>
    ),
    close: (
      <>
        <path {...p} d="M6 6 L18 18 M18 6 L6 18" />
      </>
    ),
    check: (
      <>
        <path {...p} d="M5 12 L10 17 L19 7" />
      </>
    ),
    chev: (
      <>
        <path {...p} d="M9 6 L15 12 L9 18" />
      </>
    ),
    download: (
      <>
        <path {...p} d="M12 3 V15 M7 10 L12 15 L17 10 M4 20 H20" />
      </>
    ),
    pin: (
      <>
        <path {...p} d="M12 21 s-7 -7 -7 -12 a7 7 0 0 1 14 0 c0 5 -7 12 -7 12 Z" />
        <circle {...p} cx="12" cy="9" r="2.5" />
      </>
    ),
    bolt: (
      <>
        <path {...p} d="M13 3 L4 14 H11 L11 21 L20 10 H13 Z" />
      </>
    ),
    chat: (
      <>
        <path
          {...p}
          d="M4 5 a2 2 0 0 1 2 -2 H18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H10 L5 21 V17 H6 a2 2 0 0 1 -2 -2 Z"
        />
      </>
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
  };

  const content = paths[name];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
