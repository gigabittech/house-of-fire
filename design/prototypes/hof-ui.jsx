// hof-ui.jsx — House of Fire shared UI primitives, tokens, icons.

const HOF = {
  bg:        '#0A0A08',
  surface:   '#141412',
  elevated:  '#1E1C19',
  border:    '#2A2826',
  borderHi:  '#3A3835',
  amber:     '#E8651A',
  ember:     '#C4401A',
  glow:      '#F5942A',
  gold:      '#C9942A',
  goldDim:   '#7a5a18',
  text:      '#F0EDE6',
  textSec:   '#8A8880',
  textDis:   '#4A4844',
  success:   '#4CAF6E',
  warning:   '#E8A21A',
  error:     '#E84A1A',
  info:      '#4A8AE8',
};

// ─── Phosphor-style icons (regular weight, 1.5 stroke) ──────────────────────
const Icon = ({ name, size = 20, color = HOF.textSec, ...rest }) => {
  const s = size, p = { stroke: color, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home:    <><path {...p} d="M3 11 L12 4 L21 11 V20 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 Z"/><path {...p} d="M9 21 V14 h6 v7"/></>,
    calendar:<><rect {...p} x="3" y="5" width="18" height="16" rx="2"/><path {...p} d="M3 10 H21 M8 3 V7 M16 3 V7"/></>,
    users:   <><circle {...p} cx="9" cy="9" r="3.5"/><path {...p} d="M3 19 a6 6 0 0 1 12 0"/><path {...p} d="M16 5.5 a3.5 3.5 0 0 1 0 7"/><path {...p} d="M18 19 a6 6 0 0 0 -3 -5.2"/></>,
    user:    <><circle {...p} cx="12" cy="9" r="4"/><path {...p} d="M4 20 a8 8 0 0 1 16 0"/></>,
    clock:   <><circle {...p} cx="12" cy="12" r="9"/><path {...p} d="M12 7 V12 L15 14"/></>,
    pin:     <><path {...p} d="M12 21 s-7 -7 -7 -12 a7 7 0 0 1 14 0 c0 5 -7 12 -7 12 Z"/><circle {...p} cx="12" cy="9" r="2.5"/></>,
    star:    <><path {...p} d="M12 3 L14.5 9 L21 9.5 L16 13.8 L17.5 20 L12 16.7 L6.5 20 L8 13.8 L3 9.5 L9.5 9 Z"/></>,
    ticket:  <><path {...p} d="M3 8 a2 2 0 0 1 2 -2 H19 a2 2 0 0 1 2 2 v2 a2 2 0 0 0 0 4 v2 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 v-2 a2 2 0 0 0 0 -4 Z"/><path {...p} d="M14 6 V18" strokeDasharray="2 2"/></>,
    arrowR:  <><path {...p} d="M5 12 H19 M14 7 L19 12 L14 17"/></>,
    arrowL:  <><path {...p} d="M19 12 H5 M10 7 L5 12 L10 17"/></>,
    chev:    <><path {...p} d="M9 6 L15 12 L9 18"/></>,
    chevDn:  <><path {...p} d="M6 9 L12 15 L18 9"/></>,
    plus:    <><path {...p} d="M5 12 H19 M12 5 V19"/></>,
    minus:   <><path {...p} d="M5 12 H19"/></>,
    close:   <><path {...p} d="M6 6 L18 18 M18 6 L6 18"/></>,
    check:   <><path {...p} d="M5 12 L10 17 L19 7"/></>,
    share:   <><circle {...p} cx="6" cy="12" r="2.5"/><circle {...p} cx="18" cy="6" r="2.5"/><circle {...p} cx="18" cy="18" r="2.5"/><path {...p} d="M8 11 L16 7 M8 13 L16 17"/></>,
    download:<><path {...p} d="M12 3 V15 M7 10 L12 15 L17 10 M4 20 H20"/></>,
    wallet:  <><rect {...p} x="3" y="6" width="18" height="14" rx="2"/><path {...p} d="M3 10 H21 M16 14 H18"/></>,
    camera:  <><rect {...p} x="3" y="7" width="18" height="13" rx="2"/><circle {...p} cx="12" cy="13.5" r="3.5"/><path {...p} d="M8 7 L9.5 4 H14.5 L16 7"/></>,
    image:   <><rect {...p} x="3" y="4" width="18" height="16" rx="2"/><circle {...p} cx="9" cy="10" r="1.5"/><path {...p} d="M3 17 L9 12 L15 17 L21 13"/></>,
    flame:   <><path {...p} d="M12 21 c4 0 7 -3 7 -7 c0 -4 -3 -6 -4 -9 c-1 2 -3 3 -3 5 c0 -2 -1 -3 -2 -4 c-1 3 -5 5 -5 9 c0 4 3 6 7 6 Z"/></>,
    search:  <><circle {...p} cx="11" cy="11" r="7"/><path {...p} d="M20 20 L16 16"/></>,
    settings:<><path {...p} d="M12 8 v-3 M12 19 v-3 M16 12 h3 M5 12 h3 M14.8 9.2 L17 7 M7 17 L9.2 14.8 M14.8 14.8 L17 17 M7 7 L9.2 9.2"/><circle {...p} cx="12" cy="12" r="3"/></>,
    bell:    <><path {...p} d="M6 17 V11 a6 6 0 0 1 12 0 V17 L20 19 H4 Z"/><path {...p} d="M10 21 a2 2 0 0 0 4 0"/></>,
    bolt:    <><path {...p} d="M13 3 L4 14 H11 L11 21 L20 10 H13 Z"/></>,
    music:   <><circle {...p} cx="6" cy="18" r="2.5"/><circle {...p} cx="17" cy="16" r="2.5"/><path {...p} d="M8.5 18 V6 L19.5 4 V16"/></>,
    drop:    <><path {...p} d="M12 3 c4 5 7 8 7 12 a7 7 0 0 1 -14 0 c0 -4 3 -7 7 -12 Z"/></>,
    grid:    <><rect {...p} x="3" y="3" width="7" height="7" rx="1"/><rect {...p} x="14" y="3" width="7" height="7" rx="1"/><rect {...p} x="3" y="14" width="7" height="7" rx="1"/><rect {...p} x="14" y="14" width="7" height="7" rx="1"/></>,
    chat:    <><path {...p} d="M4 5 a2 2 0 0 1 2 -2 H18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H10 L5 21 V17 H6 a2 2 0 0 1 -2 -2 Z"/></>,
    qr:      <><rect {...p} x="3" y="3" width="7" height="7"/><rect {...p} x="14" y="3" width="7" height="7"/><rect {...p} x="3" y="14" width="7" height="7"/><path {...p} d="M14 14 H17 V17 M21 14 V17 H17 M14 17 V21 H17 M21 21 V19"/></>,
    apple:   <><path fill={color} d="M16.5 2 c0 1.4 -1 3 -3 3 c-.1 -1.5 1 -3 3 -3 Z M19 17 c-.5 1.3 -1.1 2.4 -2 3.2 c-.9 .9 -1.9 1.3 -3 .8 c-1.1 -.5 -1.6 -.5 -2.8 0 c-1.5 .7 -2.4 .3 -3.2 -.4 c-2.2 -1.9 -3.5 -7 -1.3 -10.4 c.9 -1.4 2.4 -2.3 4 -2.3 c1 0 1.7 .4 2.6 .4 c.7 0 1.5 -.4 2.7 -.4 c1.4 0 2.7 .6 3.6 1.8 c-3.1 1.8 -2.6 5.4 .4 7.3 Z"/></>,
    google:  <><path fill={color} d="M21.4 12.2 c0 -.7 -.1 -1.3 -.2 -2 H12 v3.8 h5.3 c-.2 1.2 -.9 2.3 -2 3 v2.5 h3.2 c1.9 -1.7 2.9 -4.3 2.9 -7.3 Z M12 21 c2.7 0 5 -.9 6.6 -2.4 l -3.2 -2.5 c-.9 .6 -2 1 -3.4 1 c-2.6 0 -4.8 -1.7 -5.6 -4.1 H3.1 v2.6 A9 9 0 0 0 12 21 Z M6.4 13 a5.3 5.3 0 0 1 0 -3.4 V7 H3.1 a9 9 0 0 0 0 8.6 L6.4 13 Z M12 6 c1.5 0 2.8 .5 3.8 1.5 l 2.8 -2.8 A9 9 0 0 0 3.1 7 l 3.3 2.6 c .8 -2.4 3 -3.6 5.6 -3.6 Z"/></>,
    fire:    <><path stroke={color} fill={color} fillOpacity="0.15" strokeWidth="1.5" strokeLinejoin="round" d="M12 3 c2 4 6 6 6 11 a6 6 0 0 1 -12 0 c0 -3 2 -4 2 -7 c1 1 1.5 2 2 3 c.5 -3 1 -5 2 -7 Z"/></>,
    diamond: <><path {...p} d="M12 3 L21 12 L12 21 L3 12 Z"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }} {...rest}>
      {paths[name]}
    </svg>
  );
};

// ─── Logo (small emblem for nav) ────────────────────────────────────────────
const HofLogoMark = ({ size = 28 }) => (
  <img src="assets/hof-emblem.png" alt="" style={{
    width: size, height: size, display: 'block',
    filter: 'drop-shadow(0 2px 6px rgba(232,101,26,0.3))',
  }}/>
);

// ─── Big wordmark — uses the supplied PNG ───────────────────────────────────
const HofWordmark = ({ height = 56, style = {} }) => (
  <img src="assets/hof-logo.png" alt="House of Fire"
       style={{ height, width: 'auto', display: 'block', ...style }} />
);

// ─── Real photo library (resized for prototype) ─────────────────────────────
const HOF_PHOTOS = [
  { src: 'assets/photos/p1-laser-dj.jpg',    caption: 'Lasers & Lace',  ratio: 3/2 },
  { src: 'assets/photos/p3-portal-dj.jpg',   caption: 'The Portal',     ratio: 3/2 },
  { src: 'assets/photos/p4-m3dium-blue.jpg', caption: 'M3DIUM',         ratio: 3/2 },
  { src: 'assets/photos/p2-green-stage.jpg', caption: 'Jungle Boogie',  ratio: 3/4 },
];

// ─── Real photo component (with optional darkening gradient) ────────────────
const HofPhoto = ({ seed = 0, label, style = {}, gradient = true, children, objectPosition = 'center' }) => {
  const p = HOF_PHOTOS[seed % HOF_PHOTOS.length];
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: HOF.bg, ...style }}>
      <img src={p.src} alt={p.caption} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition,
      }}/>
      {gradient && <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,10,8,0.0) 50%, rgba(10,10,8,0.55) 100%)',
        pointerEvents: 'none',
      }}/>}
      {label && (
        <div style={{
          position: 'absolute', top: 8, left: 10, zIndex: 2,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          color: 'rgba(240,237,230,0.7)', letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>{label}</div>
      )}
      {children}
    </div>
  );
};

// ─── Atmospheric photo placeholder — warm-dark, lifelike, no kitsch ─────────
// Generates a deterministic-feeling gradient with overlaid amber bloom + grain.
const PhotoPlaceholder = ({ label, seed = 0, style = {}, kind = 'crowd', children }) => {
  // a tiny set of curated palettes that feel like real event photos
  const palettes = [
    { a: '#2a0d05', b: '#0A0A08', c: '#E8651A', light: '#F5942A' }, // ember
    { a: '#1a0608', b: '#0a0707', c: '#C4401A', light: '#E8651A' }, // crimson
    { a: '#1d1408', b: '#08070a', c: '#C9942A', light: '#F5942A' }, // gold
    { a: '#0e0a1a', b: '#08070d', c: '#8a3a1a', light: '#E8651A' }, // dusk
  ];
  const pal = palettes[seed % palettes.length];
  const id = `pph-${seed}-${kind}`;
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', background: pal.b,
      ...style,
    }}>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 400"
           style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id={`${id}-glow`} cx="0.3" cy="0.7" r="0.8">
            <stop offset="0%" stopColor={pal.light} stopOpacity="0.55"/>
            <stop offset="40%" stopColor={pal.c} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={pal.b} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id={`${id}-glow2`} cx="0.75" cy="0.2" r="0.6">
            <stop offset="0%" stopColor={pal.light} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={pal.b} stopOpacity="0"/>
          </radialGradient>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.a}/>
            <stop offset="100%" stopColor={pal.b}/>
          </linearGradient>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed+1}/>
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"/>
          </filter>
        </defs>
        <rect width="400" height="400" fill={`url(#${id}-base)`}/>
        <rect width="400" height="400" fill={`url(#${id}-glow)`}/>
        <rect width="400" height="400" fill={`url(#${id}-glow2)`}/>
        {/* abstract silhouettes — suggest crowd without literally drawing people */}
        {kind === 'crowd' && (
          <g opacity="0.55">
            <ellipse cx="80" cy="340" rx="65" ry="40" fill="#000"/>
            <ellipse cx="180" cy="360" rx="80" ry="38" fill="#000"/>
            <ellipse cx="310" cy="350" rx="70" ry="42" fill="#000"/>
            <circle cx="80" cy="290" r="22" fill="#000"/>
            <circle cx="180" cy="300" r="25" fill="#000"/>
            <circle cx="310" cy="290" r="22" fill="#000"/>
          </g>
        )}
        <rect width="400" height="400" filter={`url(#${id}-grain)`} opacity="0.35"/>
      </svg>
      {label && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          color: 'rgba(240,237,230,0.45)', letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>{label}</div>
      )}
      {children}
    </div>
  );
};

// ─── HOF Button ─────────────────────────────────────────────────────────────
const HofButton = ({ children, variant = 'primary', size = 'lg', icon, onClick, style = {}, full = false, disabled }) => {
  const variants = {
    primary: {
      background: HOF.amber, color: HOF.bg,
      boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    },
    ghost: {
      background: 'transparent', color: HOF.text,
      border: `1px solid ${HOF.border}`,
    },
    gold: {
      background: 'linear-gradient(180deg, #d9a838 0%, #C9942A 100%)',
      color: HOF.bg,
    },
    danger: {
      background: HOF.ember, color: HOF.text,
    },
    quiet: {
      background: HOF.elevated, color: HOF.text,
    },
  };
  const sizes = {
    lg: { height: 52, padding: '0 22px', fontSize: 15, borderRadius: 10 },
    md: { height: 44, padding: '0 18px', fontSize: 14, borderRadius: 8 },
    sm: { height: 34, padding: '0 12px', fontSize: 13, borderRadius: 8 },
  };
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizes[size],
        ...variants[variant],
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'Inter, system-ui', fontWeight: 500, letterSpacing: 0.1,
        width: full ? '100%' : 'auto',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        ...style,
      }}>
      {icon}
      {children}
    </button>
  );
};

// ─── Pill / Badge ───────────────────────────────────────────────────────────
const HofPill = ({ children, tone = 'neutral', size = 'md', icon, style = {} }) => {
  const tones = {
    neutral:  { bg: HOF.elevated, fg: HOF.textSec, br: 'transparent' },
    amber:    { bg: 'rgba(232,101,26,0.16)', fg: HOF.glow, br: 'rgba(232,101,26,0.3)' },
    gold:     { bg: 'rgba(201,148,42,0.12)', fg: HOF.gold, br: 'rgba(201,148,42,0.35)' },
    danger:   { bg: HOF.ember, fg: HOF.text, br: 'transparent' },
    warning:  { bg: HOF.warning, fg: HOF.bg, br: 'transparent' },
    success:  { bg: 'rgba(76,175,110,0.12)', fg: HOF.success, br: 'rgba(76,175,110,0.3)' },
    crew:     { bg: HOF.amber, fg: HOF.bg, br: 'transparent' },
  };
  const t = tones[tone];
  const sz = size === 'sm'
    ? { height: 20, padding: '0 8px', fontSize: 10 }
    : { height: 24, padding: '0 10px', fontSize: 11 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: t.bg, color: t.fg,
      border: `1px solid ${t.br}`,
      borderRadius: 4,
      fontFamily: 'Inter, system-ui', fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      ...sz, ...style,
    }}>
      {icon}{children}
    </span>
  );
};

// ─── Card ───────────────────────────────────────────────────────────────────
const HofCard = ({ children, padded = 16, style = {}, hover, ...rest }) => (
  <div
    style={{
      background: HOF.surface,
      border: `1px solid ${HOF.border}`,
      borderRadius: 12,
      padding: padded,
      ...style,
    }}
    {...rest}>
    {children}
  </div>
);

// ─── Faux QR — looks legit at distance ──────────────────────────────────────
const FakeQR = ({ size = 220, fg = '#0A0A08', bg = '#F0EDE6' }) => {
  // 25x25 module grid with finder patterns. Deterministic.
  const N = 25, mods = [];
  // seeded LCG for stability
  let s = 1337;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let y = 0; y < N; y++) {
    const row = [];
    for (let x = 0; x < N; x++) row.push(rand() > 0.55 ? 1 : 0);
    mods.push(row);
  }
  // Stamp finder patterns at corners (top-L, top-R, bot-L)
  const stamp = (ox, oy) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const onEdge = x === 0 || y === 0 || x === 6 || y === 6;
      const onInner = (x >= 2 && x <= 4 && y >= 2 && y <= 4);
      mods[oy + y][ox + x] = onEdge || onInner ? 1 : 0;
    }
    // clear quiet ring around
    for (let i = 0; i < 8; i++) {
      if (oy + 7 < N) mods[oy + 7][ox + i] = 0;
      if (ox + 7 < N) mods[oy + i] && (mods[oy + i][ox + 7] = 0);
    }
  };
  stamp(0, 0); stamp(N - 7, 0); stamp(0, N - 7);

  const cell = size / N;
  return (
    <div style={{
      width: size, height: size, background: bg, padding: 0,
      display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`,
      borderRadius: 6,
    }}>
      {mods.flat().map((v, i) => (
        <div key={i} style={{
          width: cell, height: cell,
          background: v ? fg : bg,
        }} />
      ))}
    </div>
  );
};

// ─── Bottom Navigation ──────────────────────────────────────────────────────
const HofBottomNav = ({ active = 'home', onChange }) => {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'events', label: 'Events', icon: 'calendar' },
    { id: 'community', label: 'Community', icon: 'chat' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: 'rgba(20,20,18,0.92)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      borderTop: `1px solid ${HOF.border}`,
      paddingBottom: 34, // home indicator safe area
      zIndex: 30,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '8px 0 6px' }}>
        {items.map(it => {
          const isActive = active === it.id;
          const c = isActive ? HOF.amber : (it.soon ? HOF.textDis : HOF.textSec);
          return (
            <button key={it.id} className="hof-btn"
                    onClick={() => !it.soon && onChange && onChange(it.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0', opacity: it.soon ? 0.6 : 1 }}>
              <Icon name={it.icon} color={c} size={22}/>
              <span style={{
                fontSize: 10, fontWeight: 500, color: c, letterSpacing: '0.04em',
                opacity: isActive ? 1 : (it.soon ? 0.7 : 0),
                height: 12, lineHeight: '12px',
              }}>{it.soon ? 'Soon' : it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Top context bar (back + title) ─────────────────────────────────────────
const HofTopBar = ({ title, onBack, right, transparent = false }) => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    paddingTop: 54, // status bar
    background: transparent ? 'transparent' : 'rgba(20,20,18,0.92)',
    backdropFilter: transparent ? 'none' : 'blur(20px)',
    borderBottom: transparent ? 'none' : `1px solid ${HOF.border}`,
  }}>
    <div style={{
      height: 48, display: 'flex', alignItems: 'center',
      padding: '0 8px', justifyContent: 'space-between',
    }}>
      <button className="hof-btn hof-press" onClick={onBack} style={{
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="arrowL" color={HOF.text} size={22}/>
      </button>
      <div style={{
        fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: HOF.text, letterSpacing: 0,
      }}>{title}</div>
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {right}
      </div>
    </div>
  </div>
);

// ─── HOF Screen wrapper (dark background, scrollable area) ──────────────────
const HofScreen = ({ children, style = {} }) => (
  <div style={{
    width: '100%', height: '100%', background: HOF.bg, color: HOF.text,
    fontFamily: 'Inter, system-ui',
    position: 'relative', overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

const HofScroll = ({ children, style = {} }) => (
  <div className="hof-scroll" style={{
    width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden',
    ...style,
  }}>
    {children}
  </div>
);

// ─── Statusbar shim (for screens inside iOS frame body) ─────────────────────
// (The iOS frame supplies its own; this is a spacer where needed)
const HofStatusbarSpacer = () => <div style={{ height: 54 }}/>;
const HofHomeSpacer = () => <div style={{ height: 90 }}/>;

Object.assign(window, {
  HOF, Icon,
  HofLogoMark, HofWordmark,
  HOF_PHOTOS, HofPhoto, PhotoPlaceholder,
  HofButton, HofPill, HofCard,
  FakeQR,
  HofBottomNav, HofTopBar,
  HofScreen, HofScroll,
  HofStatusbarSpacer, HofHomeSpacer,
});
