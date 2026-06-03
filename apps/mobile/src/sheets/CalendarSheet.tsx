'use client';

import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import type { CSSProperties } from 'react';
import { useSheet } from './useSheet';

interface CalendarSheetProps {
  open: boolean;
  onClose: () => void;
}

// Event defaults — Fireversary Edition 24
const EV = {
  title: 'House of Fire — Fireversary (Ed. 24)',
  starts: '2026-06-26T20:00:00-06:00',
  ends: '2026-06-27T01:00:00-06:00',
  location: 'Junkyard Social Club, 2525 Pearl St, Boulder, CO 80302',
  details: 'Underground house and techno. Doors 8 PM. houseoffire.events',
};

function fmtUTC(d: Date): string {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

export default function CalendarSheet({ open, onClose }: CalendarSheetProps) {
  const { mounted, shown } = useSheet(open);
  if (!mounted) return null;

  const startUTC = new Date(EV.starts);
  const endUTC = new Date(EV.ends);
  const dStart = fmtUTC(startUTC);
  const dEnd = fmtUTC(endUTC);

  const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(EV.title)}&dates=${dStart}/${dEnd}&details=${encodeURIComponent(EV.details)}&location=${encodeURIComponent(EV.location)}`;
  const outlookURL = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(EV.title)}&startdt=${startUTC.toISOString()}&enddt=${endUTC.toISOString()}&body=${encodeURIComponent(EV.details)}&location=${encodeURIComponent(EV.location)}`;
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//House of Fire//EN',
    'BEGIN:VEVENT',
    `UID:hof-${dStart}@houseoffire.events`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${dStart}`,
    `DTEND:${dEnd}`,
    `SUMMARY:${EV.title}`,
    `LOCATION:${EV.location}`,
    `DESCRIPTION:${EV.details}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  type Option = {
    id: string;
    label: string;
    sub: string;
    icon: string;
    href: string;
    target?: string;
    download?: string;
  };
  const options: Option[] = [
    {
      id: 'apple',
      label: 'Apple Calendar',
      sub: '.ics file',
      icon: 'apple',
      href: icsHref,
      download: 'house-of-fire.ics',
    },
    {
      id: 'google',
      label: 'Google Calendar',
      sub: 'Opens in a new tab',
      icon: 'google',
      href: gcalURL,
      target: '_blank',
    },
    {
      id: 'outlook',
      label: 'Outlook',
      sub: 'Opens in a new tab',
      icon: 'calendar',
      href: outlookURL,
      target: '_blank',
    },
    {
      id: 'ics',
      label: 'Download .ics',
      sub: 'For anything else',
      icon: 'download',
      href: icsHref,
      download: 'house-of-fire.ics',
    },
  ];

  const scrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 80,
    background: 'rgba(0,0,0,0.55)',
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
    borderTop: `1px solid ${colors.border}`,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: '12px 16px 38px',
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
    boxShadow: '0 -24px 60px rgba(0,0,0,0.5)',
  };

  return (
    <>
      <div style={scrim} onClick={onClose} />
      <div style={sheet}>
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: colors.border,
            margin: '0 auto 14px',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '0 4px 4px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
                letterSpacing: '-0.01em',
              }}
            >
              Add to Calendar
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 2 }}>
              Fri, June 26 · 8 PM — 1 AM · Boulder
            </div>
          </div>
          <button
            className="hof-btn hof-press"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color={colors.textSec} />
          </button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((o) => (
            <a
              key={o.id}
              href={o.href}
              target={o.target}
              download={o.download}
              rel={o.target ? 'noopener noreferrer' : undefined}
              onClick={() => setTimeout(onClose, 100)}
              className="hof-press"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={o.icon as Parameters<typeof Icon>[0]['name']}
                  size={18}
                  color={colors.text}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: colors.text }}
                >
                  {o.label}
                </div>
                <div
                  style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 1 }}
                >
                  {o.sub}
                </div>
              </div>
              <Icon name="chev" size={16} color={colors.textSec} />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
