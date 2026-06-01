// screen-tablet.jsx — iPad / tablet split-pane layout for the member app.
// List of events on the left, detail of the active one on the right.

function ScreenTablet({ nav }) {
  const [active, setActive] = React.useState('ed24');

  const events = [
    { id: 'ed24', ed: 24, title: 'Fireversary',         date: 'Jun 26', status: 'upcoming', remaining: 47 },
    { id: 'ed25', ed: 25, title: 'Mid-Summer Burn',     date: 'Jul 24', status: 'preview',  remaining: null },
    { id: 'ed23', ed: 23, title: 'Late Bloom',          date: 'May 30', status: 'past',     remaining: 0 },
    { id: 'ed22', ed: 22, title: 'Slow Burn',           date: 'Apr 25', status: 'past',     remaining: 0 },
    { id: 'ed21', ed: 21, title: 'The Equinox',         date: 'Mar 28', status: 'past',     remaining: 0 },
    { id: 'ed20', ed: 20, title: 'Year Two Open',       date: 'Feb 28', status: 'past',     remaining: 0 },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', background: HOF.bg,
      color: HOF.text, fontFamily: 'Inter',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 340, flexShrink: 0,
        borderRight: `1px solid ${HOF.border}`,
        background: HOF.surface,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand header */}
        <div style={{
          padding: '20px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${HOF.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HofLogoMark size={28}/>
            <div>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 14, color: HOF.text,
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>House of Fire</div>
              <div style={{
                fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>Member · Boulder</div>
            </div>
          </div>
          <button className="hof-btn hof-press" style={{
            width: 32, height: 32, borderRadius: 16,
            background: HOF.elevated, border: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <Icon name="bell" size={14} color={HOF.text}/>
            <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7,
                           borderRadius: 4, background: HOF.amber,
                           border: `2px solid ${HOF.surface}` }}/>
          </button>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', padding: '8px 12px', gap: 2 }}>
          {[['events','Events','calendar'],['community','Community','chat'],['archive','Archive','image'],['profile','Profile','user']].map(([k,l,ic],i) => (
            <button key={k} className="hof-btn hof-press"
                    style={{
                      flex: 1, padding: '8px 4px',
                      background: i === 0 ? HOF.elevated : 'transparent',
                      borderRadius: 6,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
              <Icon name={ic} size={16} color={i === 0 ? HOF.amber : HOF.textSec}/>
              <span style={{ fontFamily: 'Inter', fontSize: 10, color: i === 0 ? HOF.text : HOF.textSec, fontWeight: 500 }}>{l}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '6px 12px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: HOF.bg,
            border: `1px solid ${HOF.border}`, borderRadius: 8,
          }}>
            <Icon name="search" size={14} color={HOF.textSec}/>
            <input placeholder="Search editions…" style={{
              flex: 1, border: 0, background: 'transparent', outline: 'none',
              fontFamily: 'Inter', fontSize: 13, color: HOF.text,
            }}/>
          </div>
        </div>

        {/* List */}
        <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{
            padding: '10px 18px 6px',
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Upcoming</div>
          {events.filter(e => e.status !== 'past').map(e => (
            <ListRow key={e.id} ev={e} active={active === e.id} onClick={() => setActive(e.id)}/>
          ))}
          <div style={{
            padding: '14px 18px 6px',
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Past editions</div>
          {events.filter(e => e.status === 'past').map(e => (
            <ListRow key={e.id} ev={e} active={active === e.id} onClick={() => setActive(e.id)}/>
          ))}
        </div>

        {/* Footer member card */}
        <div style={{
          padding: 14, borderTop: `1px solid ${HOF.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Avatar initials="SB" role="member" size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>Sujan Bhuiyan</div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.gold }}>VIP · 12 editions</div>
          </div>
          <Icon name="settings" size={16} color={HOF.textSec}/>
        </div>
      </div>

      {/* Detail pane */}
      <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <TabletDetail event={events.find(e => e.id === active)}/>
      </div>
    </div>
  );
}

function ListRow({ ev, active, onClick }) {
  const past = ev.status === 'past';
  return (
    <button className="hof-btn hof-press" onClick={onClick}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 18px',
              background: active ? HOF.elevated : 'transparent',
              borderLeft: `2px solid ${active ? HOF.amber : 'transparent'}`,
            }}>
      <div style={{
        width: 40, height: 40, borderRadius: 6, flexShrink: 0,
        background: past ? HOF.elevated : `linear-gradient(135deg, ${HOF.ember}, ${HOF.amber})`,
        border: past ? `1px solid ${HOF.border}` : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: past ? HOF.textSec : HOF.bg,
      }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 8, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7,
        }}>{ev.date.split(' ')[0]}</div>
        <div style={{
          fontFamily: 'Clash Display', fontWeight: 700, fontSize: 16, lineHeight: 1, marginTop: 1,
        }}>{ev.date.split(' ')[1]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 14, color: HOF.text,
          }}>Ed {ev.ed}</span>
          <span style={{
            fontFamily: 'Inter', fontWeight: 400, fontSize: 13, color: HOF.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>· {ev.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {ev.status === 'upcoming' && (
            <HofPill tone="warning" size="sm">{ev.remaining} left</HofPill>
          )}
          {ev.status === 'preview' && (
            <HofPill tone="amber" size="sm">Tickets soon</HofPill>
          )}
          {ev.status === 'past' && (
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>Attended</span>
          )}
        </div>
      </div>
    </button>
  );
}

function TabletDetail({ event }) {
  if (!event) return null;
  const past = event.status === 'past';
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
        <img src="assets/photos/p1-laser-dj.jpg" alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 30%',
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,10,8,0.2) 0%, rgba(10,10,8,0.7) 60%, #0A0A08 100%)',
        }}/>
        <div style={{
          position: 'absolute', left: 32, right: 32, bottom: 28,
        }}>
          <HofPill tone={past ? 'success' : 'amber'} size="sm">
            {past ? `Attended · Ed ${event.ed}` : `Upcoming · Ed ${event.ed}`}
          </HofPill>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 700, fontSize: 56,
            color: HOF.text, marginTop: 12, letterSpacing: '-0.02em',
            lineHeight: 1, textTransform: 'uppercase',
          }}>{event.title}</div>
          <div style={{
            fontFamily: 'Inter', fontSize: 14, color: HOF.textSec, marginTop: 12, letterSpacing: '0.04em',
          }}>{event.date} · Junkyard Social Club · Boulder, CO</div>
        </div>
      </div>

      {/* Body — two columns of content */}
      <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        <div>
          {/* Meta */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
          }}>
            {[
              ['Date',     'Fri Jun 26'],
              ['Doors',    '8 PM — 1 AM'],
              ['Venue',    'Junkyard'],
              ['Capacity', '300 · 47 left'],
            ].map(([k, v]) => (
              <div key={k} style={{
                padding: 14, background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
              }}>
                <div style={{
                  fontFamily: 'Inter', fontSize: 9, color: HOF.textSec,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                }}>{k}</div>
                <div style={{
                  fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text, marginTop: 4,
                }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tickets / Action */}
          <div style={{ marginTop: 24 }}>
            <div style={{
              padding: 24,
              background: `linear-gradient(135deg, rgba(232,101,26,0.18) 0%, ${HOF.surface} 60%)`,
              border: `1px solid ${HOF.border}`, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            }}>
              <div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                }}>GA · from $28</div>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
                  color: HOF.text, marginTop: 4, letterSpacing: '-0.01em',
                }}>Selling fast — only 47 left</div>
              </div>
              <HofButton variant="primary" size="lg"
                         icon={<Icon name="ticket" size={18} color={HOF.bg}/>}>
                Get Tickets
              </HofButton>
            </div>
          </div>

          {/* Lineup */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14,
            }}>Lineup</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { t: '9:00',  name: 'IGNYTE',    note: 'Opening' },
                { t: '10:30', name: 'M3DIUM',    note: 'House' },
                { t: '12:00', name: 'HEX',       note: 'Headliner' },
                { t: '1:00',  name: 'Residents', note: 'After' },
              ].map((l, i) => (
                <div key={i} style={{
                  padding: '14px 16px',
                  background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono', fontSize: 12, color: HOF.textSec,
                    width: 44, fontVariantNumeric: 'tabular-nums',
                  }}>{l.t}</div>
                  <div>
                    <div style={{
                      fontFamily: 'Clash Display', fontWeight: 600, fontSize: 17, color: HOF.text,
                    }}>{l.name}</div>
                    <div style={{
                      fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2,
                    }}>{l.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail: thread + photos */}
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12,
          }}>Edition thread</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HOF_POSTS.filter(p => p.edition === 24).slice(0, 2).map(p => (
              <FeedPost key={p.id} post={p} compact onOpen={() => {}}/>
            ))}
          </div>

          {past && <>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
              letterSpacing: '0.22em', textTransform: 'uppercase', margin: '24px 0 12px',
            }}>Recap photos</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
            }}>
              {[0,1,2,3].map(i => (
                <HofPhoto key={i} seed={i} style={{ aspectRatio: '1/1', borderRadius: 6 }} gradient={false}/>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenTablet });
