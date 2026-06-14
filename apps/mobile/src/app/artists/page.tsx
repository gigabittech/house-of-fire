'use client';

import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { formatEventDate, type ActiveEvent } from '@/lib/eventDisplay';

export default function ArtistsPage() {
  const router = useRouter();
  const [event, setEvent] = useState<ActiveEvent | null>(null);

  const handleBack = useCallback(() => router.back(), [router]);

  useAppHeader({ title: 'Artists', onBack: handleBack });

  useEffect(() => {
    fetch('/api/events/active')
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setEvent(d.event);
      })
      .catch(console.error);
  }, []);

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
          Check back after the next theme — full bios, mixes, and set times drop here each month.
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
            {event ? (
              <>
                <span style={{ color: colors.amber }}>Theme {event.edition_number}</span>
                {' · '}
                {formatEventDate(event.date)} · {event.venue_name}
              </>
            ) : (
              <span>Loading next theme…</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
