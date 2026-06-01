import type { CSSProperties, ReactNode } from 'react';
import { fontFamilies } from '@hof/design-tokens';

export interface PhotoPlaceholderProps {
  label?: string;
  seed?: number;
  style?: CSSProperties;
  kind?: 'crowd' | 'plain';
  children?: ReactNode;
}

interface Palette {
  a: string;
  b: string;
  c: string;
  light: string;
}

// Warm-dark, lifelike photo stand-in: a deterministic gradient with an amber
// bloom + grain. Used where no real event photo is available yet.
const EMBER: Palette = { a: '#2a0d05', b: '#0A0A08', c: '#E8651A', light: '#F5942A' };
const palettes: Palette[] = [
  EMBER,
  { a: '#1a0608', b: '#0a0707', c: '#C4401A', light: '#E8651A' }, // crimson
  { a: '#1d1408', b: '#08070a', c: '#C9942A', light: '#F5942A' }, // gold
  { a: '#0e0a1a', b: '#08070d', c: '#8a3a1a', light: '#E8651A' }, // dusk
];

export function PhotoPlaceholder({
  label,
  seed = 0,
  style = {},
  kind = 'crowd',
  children,
}: PhotoPlaceholderProps) {
  const pal = palettes[seed % palettes.length] ?? EMBER;
  const id = `pph-${seed}-${kind}`;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: pal.b, ...style }}>
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 400 400"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}-glow`} cx="0.3" cy="0.7" r="0.8">
            <stop offset="0%" stopColor={pal.light} stopOpacity="0.55" />
            <stop offset="40%" stopColor={pal.c} stopOpacity="0.25" />
            <stop offset="100%" stopColor={pal.b} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-glow2`} cx="0.75" cy="0.2" r="0.6">
            <stop offset="0%" stopColor={pal.light} stopOpacity="0.4" />
            <stop offset="100%" stopColor={pal.b} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.a} />
            <stop offset="100%" stopColor={pal.b} />
          </linearGradient>
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed + 1} />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          </filter>
        </defs>
        <rect width="400" height="400" fill={`url(#${id}-base)`} />
        <rect width="400" height="400" fill={`url(#${id}-glow)`} />
        <rect width="400" height="400" fill={`url(#${id}-glow2)`} />
        {kind === 'crowd' && (
          <g opacity="0.55">
            <ellipse cx="80" cy="340" rx="65" ry="40" fill="#000" />
            <ellipse cx="180" cy="360" rx="80" ry="38" fill="#000" />
            <ellipse cx="310" cy="350" rx="70" ry="42" fill="#000" />
            <circle cx="80" cy="290" r="22" fill="#000" />
            <circle cx="180" cy="300" r="25" fill="#000" />
            <circle cx="310" cy="290" r="22" fill="#000" />
          </g>
        )}
        <rect width="400" height="400" filter={`url(#${id}-grain)`} opacity="0.35" />
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 2,
            fontFamily: fontFamilies.mono,
            fontSize: 9,
            color: 'rgba(240,237,230,0.45)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
