'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, Icon } from '@hof/ui';
import type { CSSProperties } from 'react';
import { useChromeOverlay } from '@/hooks/useChromeOverlay';
import { appOverlayFixed } from './overlay';
import { useSheet } from './useSheet';

interface MapSheetProps {
  open: boolean;
  onClose: () => void;
}

function DarkMap() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0d0c0a' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        {/* base */}
        <rect width="400" height="400" fill="#0d0c0a" />
        {/* fine grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 20}
            y1="0"
            x2={i * 20}
            y2="400"
            stroke="#16140f"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={i * 20}
            x2="400"
            y2={i * 20}
            stroke="#16140f"
            strokeWidth="0.5"
          />
        ))}
        {/* roads (Pearl St area abstracted) */}
        <path d="M0 200 L400 195" stroke="#3a3833" strokeWidth="6" />
        <path d="M0 200 L400 195" stroke="#5a564e" strokeWidth="1" />
        <path d="M120 0 L130 400" stroke="#2a2826" strokeWidth="4" />
        <path d="M260 0 L270 400" stroke="#2a2826" strokeWidth="4" />
        <path d="M0 320 L400 315" stroke="#2a2826" strokeWidth="3" />
        <path d="M0 80 L400 85" stroke="#2a2826" strokeWidth="3" />
        {/* park (open space block) */}
        <rect
          x="40"
          y="240"
          width="60"
          height="60"
          fill="#11251a"
          stroke="#1c3023"
          strokeWidth="0.5"
        />
        {/* random building footprints */}
        {(
          [
            [150, 110, 80, 60],
            [150, 220, 80, 60],
            [280, 110, 90, 50],
            [280, 230, 70, 60],
            [40, 110, 70, 70],
            [40, 30, 60, 40],
          ] as [number, number, number, number][]
        ).map(([x, y, w, h], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            fill="#1a1813"
            stroke="#2a2826"
            strokeWidth="0.5"
          />
        ))}
        {/* HoF building highlight */}
        <rect
          x="170"
          y="170"
          width="60"
          height="60"
          fill="#2a1006"
          stroke={colors.amber}
          strokeWidth="2"
        />
        {/* pin pulse */}
        <circle cx="200" cy="200" r="24" fill={colors.amber} fillOpacity="0.15">
          <animate attributeName="r" values="20;36;20" dur="2.4s" repeatCount="indefinite" />
          <animate
            attributeName="fill-opacity"
            values="0.25;0;0.25"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="200" cy="200" r="6" fill={colors.amber} />
        <circle cx="200" cy="200" r="3" fill={colors.bg} />
      </svg>
    </div>
  );
}

export function MapSheet({ open, onClose }: MapSheetProps) {
  const { mounted, shown } = useSheet(open);
  useChromeOverlay(open);
  if (!mounted) return null;

  const outer: CSSProperties = {
    ...appOverlayFixed(),
    inset: 0,
    background: colors.bg,
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 260ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: shown ? 'auto' : 'none',
  };

  return (
    <div style={outer}>
      {/* Map area — top 60% */}
      <div style={{ height: '60%', position: 'relative', overflow: 'hidden' }}>
        <DarkMap />

        {/* Top bar overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '54px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            className="hof-btn hof-press"
            onClick={onClose}
            aria-label="Close map"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: 'rgba(20,20,18,0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color={colors.text} />
          </button>
          <button
            className="hof-btn hof-press"
            aria-label="Share location"
            onClick={() => {
              const text = 'House of Fire @ Junkyard Social Club, Boulder CO';
              if (navigator.share) {
                navigator
                  .share({
                    title: text,
                    url: 'https://maps.google.com/?q=Junkyard+Social+Club+Boulder+CO',
                  })
                  .catch(console.error);
              } else {
                navigator.clipboard
                  ?.writeText('2525 Pearl St, Boulder, CO 80302')
                  .catch(console.error);
              }
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: 'rgba(20,20,18,0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="share" size={16} color={colors.text} />
          </button>
        </div>

        {/* Pin callout */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: colors.amber,
              color: colors.bg,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          >
            <Icon name="flame" size={14} color={colors.bg} />
            <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13 }}>
              House of Fire
            </span>
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `8px solid ${colors.amber}`,
              margin: '0 auto',
            }}
          />
        </div>
      </div>

      {/* Detail panel — bottom 40% */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: colors.bg,
          borderTop: `1px solid ${colors.border}`,
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 10,
              color: colors.amber,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            The Venue
          </div>
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 600,
              fontSize: 24,
              color: colors.text,
              letterSpacing: '-0.01em',
              marginTop: 4,
            }}
          >
            Junkyard Social Club
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.textSec, marginTop: 6 }}>
            2525 Pearl St, Boulder, CO 80302
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 12,
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: colors.textSec,
            }}
          >
            <span>0.8 mi · 4 min drive</span>
            <span style={{ color: colors.textDis }}>·</span>
            <span>18 min walk</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, alignItems: 'stretch' }}>
          <HofButton
            variant="primary"
            size="md"
            style={{ flex: 1, minWidth: 0 }}
            icon={<Icon name="pin" size={16} color={colors.bg} />}
            onClick={() => {
              window.open(
                'https://maps.google.com/?q=Junkyard+Social+Club+2525+Pearl+St+Boulder+CO+80302',
                '_blank',
              );
            }}
          >
            Directions
          </HofButton>
          <HofButton
            variant="ghost"
            size="md"
            style={{ flexShrink: 0 }}
            icon={<Icon name="share" size={16} color={colors.text} />}
            onClick={() => {
              const text = 'House of Fire @ Junkyard Social Club, Boulder CO';
              if (navigator.share) {
                navigator
                  .share({
                    title: text,
                    url: 'https://maps.google.com/?q=Junkyard+Social+Club+Boulder+CO',
                  })
                  .catch(console.error);
              } else {
                navigator.clipboard
                  ?.writeText('2525 Pearl St, Boulder, CO 80302')
                  .catch(console.error);
              }
            }}
          >
            Share
          </HofButton>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '14px 16px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Icon name="bolt" size={14} color={colors.warning} />
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.text, lineHeight: 1.5 }}>
            Use the <span style={{ fontWeight: 500 }}>side entrance on 23rd Street</span>. Look for
            the orange light. The main door is not in use.
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 10,
              color: colors.textSec,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Parking
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.text, lineHeight: 1.5 }}>
            Street parking only — meters off after 6 PM. Lots fill up by 10. Bike rack at the side
            entrance, ride-share is easiest.
          </div>
        </div>
      </div>
    </div>
  );
}
