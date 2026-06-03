'use client';

import { colors } from '@hof/design-tokens';
import { HofButton, Icon } from '@hof/ui';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useSheet } from './useSheet';

interface UpgradeSheetProps {
  open: boolean;
  onClose: () => void;
}

interface Benefit {
  ic: Parameters<typeof Icon>[0]['name'];
  t: string;
  s: string;
}

const BENEFITS: Benefit[] = [
  { ic: 'star', t: 'Private room', s: 'A second room with its own bar, away from the main floor.' },
  {
    ic: 'flame',
    t: 'First drink on us',
    s: 'One pour at the bar — bourbon, mezcal, beer, or water with a fancy garnish.',
  },
  {
    ic: 'ticket',
    t: 'Member pre-sale',
    s: '24 hours of access to tickets before they open to the public.',
  },
  {
    ic: 'image',
    t: 'Photo first look',
    s: 'See recap photos a week before they hit the public archive.',
  },
];

export function UpgradeSheet({ open, onClose }: UpgradeSheetProps) {
  const { mounted, shown } = useSheet(open);
  const router = useRouter();
  if (!mounted) return null;

  const scrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 80,
    background: 'rgba(0,0,0,0.6)',
    opacity: shown ? 1 : 0,
    transition: 'opacity 200ms ease-out',
  };

  const sheet: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    background: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
    maxHeight: '92%',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <>
      <div style={scrim} onClick={onClose} />
      <div style={sheet}>
        {/* Grabber */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: colors.border,
            margin: '12px auto 0',
          }}
        />

        {/* Gold gradient header */}
        <div
          style={{
            position: 'relative',
            padding: '24px 22px 22px',
            background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.amber} 100%)`,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            margin: '8px 0 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: 'rgba(10,10,8,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="star" size={16} color={colors.bg} />
            </div>
            <span
              style={{
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 11,
                color: colors.bg,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              Upgrade to VIP
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 700,
              fontSize: 30,
              color: colors.bg,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              textTransform: 'uppercase',
            }}
          >
            The room behind
            <br />
            the room.
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.bg,
              opacity: 0.75,
              marginTop: 10,
              lineHeight: 1.5,
              maxWidth: 300,
            }}
          >
            12 of you have done this since Edition 10. They keep doing it. There&apos;s a reason.
          </div>
        </div>

        {/* Scrollable benefits + price */}
        <div
          className="hof-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 28px' }}
        >
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 10,
              color: colors.gold,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            What you get
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '14px 16px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: 'rgba(201,148,42,0.12)',
                    border: '1px solid rgba(201,148,42,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={b.ic} size={16} color={colors.gold} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 14,
                      color: colors.text,
                    }}
                  >
                    {b.t}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: colors.textSec,
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {b.s}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price ladder */}
          <div
            style={{
              marginTop: 22,
              padding: 18,
              background: colors.bg,
              border: `1px solid ${colors.gold}`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'Inter', fontSize: 13, color: colors.textSec }}>
                Your current ticket · GA
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  color: colors.textSec,
                  fontVariantNumeric: 'tabular-nums',
                  textDecoration: 'line-through',
                }}
              >
                $28
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <span
                style={{ fontFamily: 'Inter', fontSize: 14, color: colors.text, fontWeight: 500 }}
              >
                Upgrade to VIP
              </span>
              <span
                style={{
                  fontFamily: 'Clash Display',
                  fontWeight: 700,
                  fontSize: 22,
                  color: colors.gold,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                +$27
              </span>
            </div>
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid ${colors.border}`,
                fontFamily: 'Inter',
                fontSize: 11,
                color: colors.textSec,
              }}
            >
              Charges Visa ···· 4242 · 10 VIP spots left for Edition 24
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <HofButton
              variant="gold"
              full
              icon={<Icon name="star" size={16} color={colors.bg} />}
              onClick={async () => {
                const r = await fetch('/api/events/upcoming');
                const d = (await r.json()) as {
                  event?: { ticket_tiers?: Array<{ id: string; name: string }> };
                };
                const vipTier = d.event?.ticket_tiers?.find((t) => t.name === 'vip');
                if (vipTier) {
                  router.push(`/checkout?tierId=${encodeURIComponent(vipTier.id)}`);
                  onClose();
                }
              }}
            >
              Upgrade for $27
            </HofButton>
            <div style={{ height: 8 }} />
            <HofButton variant="ghost" full onClick={onClose}>
              Stay on GA
            </HofButton>
          </div>
        </div>
      </div>
    </>
  );
}
