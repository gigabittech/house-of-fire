'use client';

import { forwardRef } from 'react';
import { formatDoorsTime } from '@/lib/formatters';

export type WalkUpTicketCardProps = {
  editionNumber: number;
  eventName: string;
  tierLabel: string;
  holderName: string;
  eventDate: string;
  venueName: string;
  doorsOpen: string;
  doorsClose: string;
  code: string;
  qrUrl: string;
  ticketIndex?: number;
  ticketTotal?: number;
};

const CREAM = '#f5f2e9';
const INK = '#0a0a08';
const MUTED = 'rgba(10,10,8,0.45)';
const AMBER = '#ea580c';
const GOLD = '#c9942a';

function tierBadgeStyle(tier: string): { background: string; color: string } {
  if (tier.toLowerCase().includes('vip')) {
    return { background: GOLD, color: INK };
  }
  return { background: AMBER, color: INK };
}

export const WalkUpTicketCard = forwardRef<HTMLDivElement, WalkUpTicketCardProps>(
  function WalkUpTicketCard(
    {
      editionNumber,
      eventName,
      tierLabel,
      holderName,
      eventDate,
      venueName,
      doorsOpen,
      doorsClose,
      code,
      qrUrl,
      ticketIndex = 1,
      ticketTotal = 1,
    },
    ref,
  ) {
    const dateLabel = new Date(`${eventDate}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const doorsLabel = `${formatDoorsTime(doorsOpen)} — ${formatDoorsTime(doorsClose)}`;
    const badge = tierBadgeStyle(tierLabel);
    const admitLabel =
      ticketTotal > 1
        ? `EDITION ${editionNumber} · ADMIT ONE · ${ticketIndex} OF ${ticketTotal}`
        : `EDITION ${editionNumber} · ADMIT ONE`;

    const labelStyle: React.CSSProperties = {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 9,
      color: MUTED,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      lineHeight: 1.2,
    };

    const valueStyle: React.CSSProperties = {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600,
      fontSize: 13,
      color: INK,
      marginTop: 4,
      lineHeight: 1.25,
    };

    return (
      <div
        ref={ref}
        data-ticket-export-root
        style={{
          background: '#000',
          padding: 0,
          lineHeight: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 360,
            maxWidth: '100%',
            borderRadius: 14,
            overflow: 'hidden',
            background: CREAM,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            lineHeight: 'normal',
          }}
        >
          <div style={{ padding: '22px 22px 18px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ ...labelStyle, fontSize: 10, letterSpacing: '0.14em' }}>
                {admitLabel}
              </div>
              <span
                style={{
                  padding: '5px 10px',
                  background: badge.background,
                  color: badge.color,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: 6,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {tierLabel}
              </span>
            </div>

            <div
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: INK,
                marginTop: 14,
              }}
            >
              House of Fire
            </div>

            <div
              style={{
                fontFamily: 'Clash Display, system-ui, sans-serif',
                fontWeight: 600,
                fontSize: 28,
                color: INK,
                marginTop: 8,
                lineHeight: 1.05,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              {eventName}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px 20px',
                marginTop: 18,
              }}
            >
              <div>
                <div style={labelStyle}>Date</div>
                <div style={valueStyle}>{dateLabel}</div>
              </div>
              <div>
                <div style={labelStyle}>Doors</div>
                <div style={valueStyle}>{doorsLabel}</div>
              </div>
              <div>
                <div style={labelStyle}>Venue</div>
                <div style={valueStyle}>{venueName}</div>
              </div>
              <div>
                <div style={labelStyle}>Holder</div>
                <div style={valueStyle}>{holderName}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              height: 20,
              background: CREAM,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -11,
                top: '50%',
                width: 22,
                height: 22,
                background: '#000',
                borderRadius: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: -11,
                top: '50%',
                width: 22,
                height: 22,
                background: '#000',
                borderRadius: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 18,
                right: 18,
                top: '50%',
                borderTop: '1.5px dashed rgba(10,10,8,0.22)',
              }}
            />
          </div>

          <div
            style={{
              padding: '12px 22px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: CREAM,
            }}
          >
            {qrUrl ? (
              // biome-ignore lint/performance/noImgElement: data URL QR export
              <img
                src={qrUrl}
                alt={`QR ${code}`}
                width={220}
                height={220}
                style={{ display: 'block' }}
              />
            ) : (
              <div style={{ width: 220, height: 220, background: '#e8e4dc' }} />
            )}
            <div
              style={{
                marginTop: 14,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 14,
                color: INK,
                letterSpacing: '0.12em',
                fontWeight: 500,
              }}
            >
              {code}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                color: MUTED,
              }}
            >
              Show at the door · keep brightness up
            </div>
          </div>
        </div>
      </div>
    );
  },
);
