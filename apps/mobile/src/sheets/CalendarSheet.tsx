'use client';

import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import type { CSSProperties } from 'react';
import { buildCalendarEventData, type UpcomingEvent } from '@/lib/eventDisplay';
import { useSheet } from './useSheet';

interface CalendarSheetProps {
  open: boolean;
  onClose: () => void;
  event?: Pick<
    UpcomingEvent,
    | 'name'
    | 'edition_number'
    | 'date'
    | 'doors_open'
    | 'doors_close'
    | 'venue_name'
    | 'venue_address'
    | 'tagline'
  >;
}

const FALLBACK = buildCalendarEventData({
  name: 'Fireversary',
  edition_number: 24,
  date: '2026-06-26',
  doors_open: '20:00',
  doors_close: '02:00',
  venue_name: 'Junkyard Social Club',
  venue_address: '1935 55th St, Boulder, CO 80301',
  tagline: '2-Year Anniversary',
});

function fmtUTC(d: Date): string {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

export default function CalendarSheet({ open, onClose, event }: CalendarSheetProps) {
  const { mounted, shown } = useSheet(open);
  if (!mounted) return null;

  const EV = event ? buildCalendarEventData(event) : FALLBACK;

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
      icon: 'outlook',
      href: outlookURL,
      target: '_blank',
    },
  ];

  const sheetStyle: CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderRadius: '20px 20px 0 0',
    padding: '20px 20px 32px',
    transform: shown ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
    maxHeight: '85vh',
    overflowY: 'auto',
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 299,
          background: 'rgba(0,0,0,0.55)',
          opacity: shown ? 1 : 0,
          transition: 'opacity 0.28s ease',
          pointerEvents: shown ? 'auto' : 'none',
        }}
      />
      <div style={sheetStyle}>
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: colors.border,
            margin: '0 auto 20px',
          }}
        />
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.textSec,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          Add to calendar
        </div>
        <div
          style={{
            fontFamily: 'Clash Display',
            fontWeight: 600,
            fontSize: 22,
            color: colors.text,
            marginTop: 6,
            marginBottom: 20,
            letterSpacing: '-0.01em',
          }}
        >
          {EV.title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt) => (
            <a
              key={opt.id}
              href={opt.href}
              target={opt.target}
              download={opt.download}
              rel={opt.target === '_blank' ? 'noopener noreferrer' : undefined}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                textDecoration: 'none',
                color: colors.text,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: colors.elevated,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={opt.icon as Parameters<typeof Icon>[0]['name']} size={18} />
              </div>
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14 }}>
                  {opt.label}
                </div>
                <div
                  style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginTop: 2 }}
                >
                  {opt.sub}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
