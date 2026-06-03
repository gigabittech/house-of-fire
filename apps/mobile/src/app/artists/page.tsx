'use client';

import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import { useRouter } from 'next/navigation';

export default function ArtistsPage() {
  const router = useRouter();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        background: '#0A0A08',
        paddingBottom: 48,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 16px 12px',
          background: 'rgba(10,10,8,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="chev" size={18} color={colors.text} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 16,
            color: colors.text,
          }}
        >
          Artists
        </span>
        <div style={{ width: 38 }} />
      </div>

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: 'rgba(232,101,26,0.1)',
            border: `1px solid rgba(232,101,26,0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Icon name="music" size={32} color={colors.amber} />
        </div>

        <div
          style={{
            fontFamily: 'Clash Display',
            fontWeight: 700,
            fontSize: 28,
            color: colors.text,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            maxWidth: 260,
          }}
        >
          Artist profiles coming soon
        </div>

        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 14,
            color: colors.textSec,
            lineHeight: 1.65,
            maxWidth: 300,
          }}
        >
          Check back after the next edition — full bios, mixes, and set times drop here each month.
        </div>

        <div
          style={{
            marginTop: 8,
            padding: '10px 20px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            fontFamily: 'Inter',
            fontSize: 12,
            color: colors.textSec,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="flame" size={12} color={colors.amber} />
          <span>
            <span style={{ color: colors.amber }}>Edition 24</span> · Jun 26 · Junkyard Social Club
          </span>
        </div>
      </div>
    </div>
  );
}
