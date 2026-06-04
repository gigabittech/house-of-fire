// calendar-sheet.jsx — "Add to Calendar" bottom sheet + trigger pill
// Shared between Event detail and Home hero.

function CalendarSheet({ open, onClose, event }) {
  // Lock the visible mounting so the sheet can animate in/out
  const [mounted, setMounted] = React.useState(open);
  const [shown, setShown]     = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // next tick → animate up
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  // Event defaults — Fireversary
  const ev = event || {
    title:    'House of Fire — Fireversary (Th. 24)',
    starts:   '2026-06-26T20:00:00-06:00',
    ends:     '2026-06-27T01:00:00-06:00',
    location: 'Junkyard Social Club, 2525 Pearl St, Boulder, CO 80302',
    details:  'Underground house and techno. Doors 8 PM. houseoffire.events',
  };

  const startUTC = new Date(ev.starts);
  const endUTC   = new Date(ev.ends);
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const dStart = fmt(startUTC), dEnd = fmt(endUTC);

  const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dStart}/${dEnd}&details=${encodeURIComponent(ev.details)}&location=${encodeURIComponent(ev.location)}`;
  const outlookURL = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(ev.title)}&startdt=${startUTC.toISOString()}&enddt=${endUTC.toISOString()}&body=${encodeURIComponent(ev.details)}&location=${encodeURIComponent(ev.location)}`;

  const icsContent =
    `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//House of Fire//EN\nBEGIN:VEVENT\n` +
    `UID:hof-${dStart}@houseoffire.events\nDTSTAMP:${fmt(new Date())}\n` +
    `DTSTART:${dStart}\nDTEND:${dEnd}\n` +
    `SUMMARY:${ev.title}\nLOCATION:${ev.location}\nDESCRIPTION:${ev.details}\n` +
    `END:VEVENT\nEND:VCALENDAR`;
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  const options = [
    { id: 'apple',   label: 'Apple Calendar', sub: '.ics file',           icon: 'apple',    href: icsHref, download: 'house-of-fire.ics' },
    { id: 'google',  label: 'Google Calendar', sub: 'Opens in a new tab', icon: 'google',   href: gcalURL, target: '_blank' },
    { id: 'outlook', label: 'Outlook',         sub: 'Opens in a new tab', icon: 'calendar', href: outlookURL, target: '_blank' },
    { id: 'ics',     label: 'Download .ics',   sub: 'For anything else',  icon: 'download', href: icsHref, download: 'house-of-fire.ics' },
  ];

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: 'rgba(0,0,0,0.55)',
        opacity: shown ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}/>
      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90,
        background: HOF.surface,
        borderTop: `1px solid ${HOF.border}`,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '12px 16px 38px',
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
        boxShadow: '0 -24px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Grabber */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: HOF.border, margin: '0 auto 14px',
        }}/>

        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          padding: '0 4px 4px',
        }}>
          <div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
              color: HOF.text, letterSpacing: '-0.01em',
            }}>Add to Calendar</div>
            <div style={{
              fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
            }}>Fri, June 26 · 8 PM — 1 AM · Boulder</div>
          </div>
          <button className="hof-btn hof-press" onClick={onClose}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: HOF.elevated, border: `1px solid ${HOF.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
            <Icon name="close" size={16} color={HOF.textSec}/>
          </button>
        </div>

        <div style={{
          marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {options.map(o => (
            <a key={o.id} href={o.href}
               target={o.target || undefined}
               download={o.download || undefined}
               rel={o.target ? 'noopener noreferrer' : undefined}
               onClick={() => setTimeout(onClose, 100)}
               className="hof-press"
               style={{
                 textDecoration: 'none',
                 display: 'flex', alignItems: 'center', gap: 14,
                 padding: '14px 16px',
                 background: HOF.elevated,
                 border: `1px solid ${HOF.border}`,
                 borderRadius: 12,
               }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: HOF.surface, border: `1px solid ${HOF.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={o.icon} size={18} color={HOF.text}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>
                  {o.label}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 1 }}>
                  {o.sub}
                </div>
              </div>
              <Icon name="chev" size={16} color={HOF.textSec}/>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

// Pill-style trigger — for placing in the top bar of Home or Event.
function CalendarChip({ onClick, size = 38 }) {
  return (
    <button className="hof-btn hof-press" onClick={onClick} aria-label="Add to calendar"
            style={{
              width: size, height: size, borderRadius: size / 2,
              background: 'rgba(20,20,18,0.7)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${HOF.border}`,
              position: 'relative',
            }}>
      <Icon name="calendar" size={18} color={HOF.text}/>
      {/* tiny + corner */}
      <span style={{
        position: 'absolute', top: -2, right: -2,
        width: 14, height: 14, borderRadius: 7,
        background: HOF.amber, color: HOF.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter', fontSize: 11, fontWeight: 700, lineHeight: 1,
        border: `2px solid ${HOF.bg}`,
      }}>+</span>
    </button>
  );
}

Object.assign(window, { CalendarSheet, CalendarChip });
