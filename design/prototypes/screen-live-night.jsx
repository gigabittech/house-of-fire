// screen-live-night.jsx — "Doors are open" Home variant (day-of experience)
// Replaces the normal Home when the user has a ticket and the event is live.

function ScreenLiveNight({ nav, onOpenTicket, onOpenPost }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = new Date(now).getHours();
  const mm = String(new Date(now).getMinutes()).padStart(2, '0');

  return (
    <HofScreen>
      {/* Live banner top */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, zIndex: 10,
        padding: '10px 16px',
        background: HOF.amber,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 4, background: HOF.bg,
            animation: 'hof-pulse 1.4s ease-in-out infinite',
          }}/>
          <span style={{
            fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: HOF.bg,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Doors are open</span>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.bg,
          fontVariantNumeric: 'tabular-nums', fontWeight: 600,
        }}>{hh}:{mm} MT</span>
      </div>

      <HofScroll>
        <div style={{ height: 92 }}/>

        {/* QR-first hero — your ticket */}
        <div style={{ padding: '14px 16px 0' }}>
          <button className="hof-btn hof-press" onClick={onOpenTicket}
                  style={{
                    width: '100%', padding: 0, textAlign: 'left',
                    background: HOF.text, borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(232,101,26,0.25), 0 0 0 1px rgba(240,237,230,0.1)',
                    display: 'block',
                  }}>
            <div style={{ padding: '16px 18px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  fontFamily: 'Inter', fontSize: 10, color: HOF.bg, opacity: 0.55,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                }}>Your ticket · Th 24</div>
                <span style={{
                  padding: '3px 7px', background: HOF.amber, color: HOF.bg,
                  fontFamily: 'Inter', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: 3,
                }}>GA</span>
              </div>
            </div>
            <div style={{
              padding: '4px 16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <FakeQR size={220} fg={HOF.bg} bg={HOF.text}/>
              <div style={{
                marginTop: 12, fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.bg,
                letterSpacing: '0.16em', fontWeight: 500,
              }}>HOF—24—4218 · Sujan B.</div>
            </div>
          </button>
        </div>

        {/* Tap-to-brighten hint */}
        <div style={{
          margin: '10px 16px 0', padding: '10px 14px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="bolt" size={14} color={HOF.warning}/>
          <div style={{
            flex: 1, fontFamily: 'Inter', fontSize: 12, color: HOF.textSec,
          }}>
            Brightness will auto-max when you reach the scanner.
          </div>
        </div>

        {/* Live thread strip */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
          }}>
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 4,
                  background: HOF.amber, color: HOF.bg,
                  fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: 3, background: HOF.bg,
                    animation: 'hof-pulse 1.4s ease-in-out infinite',
                  }}/>
                  Live
                </span>
                <span style={{
                  fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                }}>Tonight's thread</span>
              </div>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
                color: HOF.text, marginTop: 6, letterSpacing: '-0.01em',
              }}>Fireversary · open mic</div>
            </div>
            <button className="hof-btn" onClick={() => onOpenPost && onOpenPost('community')}
                    style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.amber, fontWeight: 500 }}>
              Open →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { i: 'JG', n: 'Jordan', role: 'crew', t: '3m', b: 'IGNYTE just dropped the Floating Points edit. It is so loud right now.' },
              { i: 'TR', n: 'Tara',   role: 'member', t: '8m', b: 'Bartender in white shirt is keeping us alive. tip!' },
              { i: 'DP', n: 'Devon',  role: 'member', t: '14m', b: 'Anyone seen a black jacket near the coat check? Mid-length.' },
            ].map((p, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 12px',
                background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
              }}>
                <Avatar initials={p.i} role={p.role} size={28}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
                  }}>
                    <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: HOF.text }}>{p.n}</span>
                    {p.role === 'crew' && <HofPill tone="crew" size="sm">Crew</HofPill>}
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textSec }}>· {p.t}</span>
                  </div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.4,
                  }}>{p.b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Set times — collapsible */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>Now playing · Set times</div>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            overflow: 'hidden',
          }}>
            {[
              { t: '9:00',  name: 'IGNYTE',   status: 'past' },
              { t: '10:30', name: 'M3DIUM',   status: 'now' },
              { t: '12:00', name: 'HEX',      status: 'next' },
              { t: '1:00',  name: 'Residents', status: 'later' },
            ].map((l, i, a) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                borderBottom: i < a.length - 1 ? `1px solid ${HOF.border}` : 'none',
                opacity: l.status === 'past' ? 0.4 : 1,
                background: l.status === 'now' ? 'rgba(232,101,26,0.06)' : 'transparent',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: 12,
                  color: l.status === 'now' ? HOF.amber : HOF.textSec,
                  width: 44, fontVariantNumeric: 'tabular-nums',
                }}>{l.t}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Clash Display', fontWeight: 600, fontSize: 16,
                    color: l.status === 'now' ? HOF.amber : HOF.text,
                  }}>{l.name}</div>
                </div>
                {l.status === 'now' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
                    letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: 3, background: HOF.amber,
                      animation: 'hof-pulse 1.4s ease-in-out infinite',
                    }}/>
                    Now
                  </span>
                )}
                {l.status === 'next' && (
                  <span style={{ fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>Up next</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Useful at the venue */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>At the venue</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              ['Bar / Water',    'pin',   'Free water · cash bar'],
              ['Coat check',     'wallet','$3 cash · Venmo backup'],
              ['Restrooms',      'user',  'Back hallway · left'],
              ['Photographer',   'camera','Mauro · ask before pics'],
            ].map(([t, ic, sub]) => (
              <div key={t} style={{
                padding: '12px 14px',
                background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
              }}>
                <Icon name={ic} size={16} color={HOF.amber}/>
                <div style={{
                  fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text, marginTop: 8,
                }}>{t}</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2, lineHeight: 1.4,
                }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency strip */}
        <div style={{ padding: '24px 16px 0' }}>
          <button className="hof-btn hof-press" style={{
            width: '100%', padding: '12px 14px', textAlign: 'left',
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              background: 'rgba(232,74,26,0.12)',
              border: `1px solid rgba(232,74,26,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="bolt" size={14} color={HOF.error}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>
                Reach Crew or report something
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 1 }}>
                Crew is in the room. Discreet help button.
              </div>
            </div>
            <Icon name="chev" size={14} color={HOF.textSec}/>
          </button>
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      <HofBottomNav active="home" onChange={nav}/>
    </HofScreen>
  );
}

Object.assign(window, { ScreenLiveNight });
