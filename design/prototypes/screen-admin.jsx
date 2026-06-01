// screen-admin.jsx — Admin dashboard (Jordan's view, desktop)

function ScreenAdmin({ startView = 'dashboard', doorModalOpen = false } = {}) {
  const [active, setActive] = React.useState(startView);
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      background: HOF.bg, color: HOF.text, fontFamily: 'Inter, system-ui',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 232, flexShrink: 0,
        background: HOF.surface, borderRight: `1px solid ${HOF.border}`,
        padding: '20px 14px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 22px' }}>
          <HofLogoMark size={24}/>
          <div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 13, color: HOF.text,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>House of Fire</div>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>Admin Console</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['dashboard',  'home',     'Dashboard'],
            ['events',     'calendar', 'Events'],
            ['guests',     'users',    'Guest list'],
            ['door',       'qr',       'Door'],
            ['media',      'image',    'Photo review'],
            ['members',    'user',     'Members'],
            ['mod',        'chat',     'Moderation'],
            ['announce',   'bell',     'Announcements'],
            ['codes',      'ticket',   'Codes & comps'],
            ['financials', 'wallet',   'Financials'],
          ].map(([id, ic, label]) => (
            <button key={id} className="hof-btn" onClick={() => setActive(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 6,
                      background: active === id ? HOF.elevated : 'transparent',
                      color: active === id ? HOF.text : HOF.textSec,
                      textAlign: 'left',
                    }}>
              <Icon name={ic} size={16} color={active === id ? HOF.amber : HOF.textSec}/>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              {id === 'media' && (
                <span style={{
                  marginLeft: 'auto',
                  background: HOF.amber, color: HOF.bg,
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 8,
                }}>4</span>
              )}
              {id === 'mod' && (
                <span style={{
                  marginLeft: 'auto',
                  background: HOF.warning, color: HOF.bg,
                  fontSize: 10, fontWeight: 600,
                  padding: '2px 6px', borderRadius: 8,
                }}>2</span>
              )}
              {id === 'door' && (
                <span style={{
                  marginLeft: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 9, fontWeight: 600,
                  color: HOF.success,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: 3, background: HOF.success,
                    animation: 'hof-pulse 1.4s ease-in-out infinite',
                  }}/>
                  Live
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '12px 6px',
                      borderTop: `1px solid ${HOF.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: `linear-gradient(135deg, ${HOF.amber}, ${HOF.ember})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: HOF.bg,
          }}>JG</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: HOF.text }}>Jordan Groth</div>
            <div style={{ fontSize: 10, color: HOF.textSec }}>Owner · Boulder</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {active === 'door' ? <AdminDoorPane defaultModalOpen={doorModalOpen}/> :
         active === 'announce' ? <AdminAnnouncePane/> :
         active === 'mod' ? <AdminModerationPane/> :
         active === 'events' ? <AdminEventsPane/> :
         active === 'members' ? <AdminMembersPane/> :
         active === 'codes' ? <AdminCodesPane/> :
         active === 'financials' ? <AdminFinancialsPane/> : (
        <>
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: `1px solid ${HOF.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Dashboard</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
              color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
            }}>Fireversary · Edition 24</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
              Friday, June 26 · 8 PM · Junkyard Social Club
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <HofButton variant="ghost" size="md" icon={<Icon name="download" size={14} color={HOF.text}/>}>
              Export CSV
            </HofButton>
            <HofButton variant="primary" size="md" icon={<Icon name="plus" size={14} color={HOF.bg}/>}>
              New event
            </HofButton>
          </div>
        </div>

        {/* KPIs */}
        <div style={{
          padding: '20px 28px 0',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        }}>
          <Kpi label="Revenue · gross" value="$7,684" delta="+12% vs last" tone="amber"/>
          <Kpi label="Tickets sold"     value="253 / 300" delta="84% capacity" tone="neutral" progress={84}/>
          <Kpi label="Checked in"       value="0" delta="Doors open Fri 8 PM" tone="muted"/>
          <Kpi label="Open requests"    value="3" delta="2 photo · 1 refund" tone="warning"/>
        </div>

        {/* Two-col */}
        <div style={{
          padding: '20px 28px',
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
        }}>
          {/* Sales trend */}
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            padding: 18,
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14,
            }}>
              <div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                }}>Sales · 14 days</div>
                <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                              color: HOF.text, marginTop: 4 }}>Steady momentum</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['1D','7D','14D','All'].map(p => (
                  <span key={p} style={{
                    fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
                    padding: '5px 10px', borderRadius: 6,
                    background: p === '14D' ? HOF.elevated : 'transparent',
                    color: p === '14D' ? HOF.text : HOF.textSec,
                  }}>{p}</span>
                ))}
              </div>
            </div>
            <SalesChart/>
          </div>

          {/* Tier breakdown */}
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            padding: 18,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14,
            }}>By tier</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TierBar name="Early Bird" sold={80} total={80} color={HOF.amber} sub="$1,600 · sold out"/>
              <TierBar name="General"    sold={143} total={180} color={HOF.glow} sub="$4,004 · 37 left"/>
              <TierBar name="VIP"        sold={30} total={40} color={HOF.gold} sub="$1,650 · 10 left"/>
            </div>
            <div style={{
              marginTop: 18, padding: '12px 0 0', borderTop: `1px solid ${HOF.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec }}>Projected at sellout</span>
              <span style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                             color: HOF.text }}>$9,260</span>
            </div>
          </div>
        </div>

        {/* Guest list + Photo review */}
        <div style={{
          padding: '0 28px 28px',
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
        }}>
          <GuestList/>
          <PhotoReview/>
        </div>
        </>)}
      </div>
    </div>
  );
}

// ─── Door pane wrapper ──────────────────────────────────────────────────────
function AdminDoorPane({ defaultModalOpen = false }) {
  return (
    <>
      <div style={{
        padding: '22px 28px 18px',
        borderBottom: `1px solid ${HOF.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Door · Tonight</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
          }}>Fireversary · Edition 24</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
            Doors open since 8:00 PM · Junkyard Social Club
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 6,
            background: 'rgba(76,175,110,0.10)',
            border: `1px solid rgba(76,175,110,0.3)`,
            fontFamily: 'Inter', fontSize: 11, color: HOF.success,
            letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 3, background: HOF.success,
              animation: 'hof-pulse 1.4s ease-in-out infinite',
            }}/>
            Scanner live
          </span>
          <HofButton variant="ghost" size="md" icon={<Icon name="download" size={14} color={HOF.text}/>}>
            Reconcile
          </HofButton>
        </div>
      </div>
      <DoorDesktopView defaultModalOpen={defaultModalOpen}/>
    </>
  );
}

// ─── Announcements pane (compose + history) ───────────────────────────────
function AdminAnnouncePane() {
  const [title, setTitle] = React.useState('');
  const [body, setBody]   = React.useState('');
  const [postTo, setPostTo] = React.useState({ feed: true, sms: false, email: false });
  const [photoChosen, setPhotoChosen] = React.useState(false);

  const HISTORY = [
    { k: 'announcement', t: 'Edition 24 lineup is final',
      b: 'Headliner reveal: HEX. Doors 8 PM sharp — we open the floor at 9.',
      meta: 'Jordan · yesterday', stats: '52 🔥 · 7 replies', tone: 'amber' },
    { k: 'recap',        t: 'Edition 23 recap is up',
      b: '127 photos from the night. Tag yourself.',
      meta: 'Crew · 3 days ago', stats: '184 🔥 · 21 replies', tone: 'amber' },
    { k: 'quick',        t: 'Coat check is $3 cash tonight',
      b: 'See you at 9. Don\'t be late.',
      meta: 'Jordan · last week', stats: '12 🔥 · 3 replies', tone: 'neutral' },
  ];

  return (
    <>
      <div style={{
        padding: '22px 28px 18px',
        borderBottom: `1px solid ${HOF.border}`,
      }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>Announcements</div>
        <div style={{
          fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
          color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
        }}>Talk to the house</div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
          What you post here lands on every member's home feed.
        </div>
      </div>

      <div style={{
        padding: '20px 28px',
        display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
      }}>
        {/* Compose card */}
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12,
          }}>New post</div>

          <input value={title} onChange={e => setTitle(e.target.value)}
                 placeholder="Title (e.g. Lineup announced)"
                 style={{
                   width: '100%', boxSizing: 'border-box',
                   height: 48, padding: '0 14px',
                   background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
                   fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                   color: HOF.text, outline: 'none', letterSpacing: '-0.01em',
                 }}/>
          <textarea value={body} onChange={e => setBody(e.target.value)}
                    placeholder="What's the message? Keep it short — like a friend texting the group chat."
                    rows={5}
                    style={{
                      width: '100%', boxSizing: 'border-box', marginTop: 10,
                      padding: 14, resize: 'vertical',
                      background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
                      fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
                      lineHeight: 1.5,
                    }}/>

          {/* Photo slot */}
          <div style={{ marginTop: 12 }}>
            {!photoChosen ? (
              <button className="hof-btn hof-press" onClick={() => setPhotoChosen(true)}
                      style={{
                        width: '100%', padding: '14px 16px',
                        background: HOF.bg,
                        border: `1px dashed ${HOF.border}`, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
                      }}>
                <Icon name="image" size={16} color={HOF.textSec}/>
                Attach photo or recap collage
              </button>
            ) : (
              <div style={{
                position: 'relative', borderRadius: 10, overflow: 'hidden',
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr',
                gap: 4, height: 160,
              }}>
                <HofPhoto seed={0} gradient={false} style={{ gridRow: '1 / 3', height: '100%' }}/>
                <HofPhoto seed={1} gradient={false}/>
                <HofPhoto seed={2} gradient={false}/>
                <HofPhoto seed={3} gradient={false} style={{ gridColumn: '2 / 4' }}/>
                <button className="hof-btn hof-press" onClick={() => setPhotoChosen(false)}
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 24, height: 24, borderRadius: 12,
                          background: 'rgba(10,10,8,0.8)', backdropFilter: 'blur(6px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${HOF.border}`,
                        }}>
                  <Icon name="close" size={11} color={HOF.text}/>
                </button>
              </div>
            )}
          </div>

          {/* Channels */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ChannelToggle on={postTo.feed}
                           onChange={v => setPostTo(p => ({ ...p, feed: v }))}
                           title="Post to home feed" sub="Visible to all members on the app home screen."
                           recommended/>
            <ChannelToggle on={postTo.email}
                           onChange={v => setPostTo(p => ({ ...p, email: v }))}
                           title="Email subscribers" sub="1,247 people on The Smoke Signal."/>
            <ChannelToggle on={postTo.sms}
                           onChange={v => setPostTo(p => ({ ...p, sms: v }))}
                           title="SMS attendees" sub="Only people holding a ticket to Edition 24."/>
          </div>

          {/* Submit row */}
          <div style={{
            marginTop: 18, paddingTop: 16, borderTop: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>
              Posting as <span style={{ color: HOF.text, fontWeight: 500 }}>Jordan Groth</span> · Crew
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <HofButton variant="ghost" size="md">Save draft</HofButton>
              <HofButton variant="primary" size="md"
                         disabled={!title.trim() || !body.trim()}
                         icon={<Icon name="bell" size={14} color={HOF.bg}/>}>
                Publish
              </HofButton>
            </div>
          </div>
        </div>

        {/* History */}
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12,
          }}>Recent posts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HISTORY.map((p, i) => (
              <div key={i} style={{
                padding: 14, background: HOF.bg,
                border: `1px solid ${HOF.border}`, borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <HofPill tone={p.tone} size="sm">{p.k}</HofPill>
                  <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>{p.meta}</span>
                </div>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 15,
                  color: HOF.text, letterSpacing: '-0.01em',
                }}>{p.t}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4, lineHeight: 1.4 }}>
                  {p.b}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textSec,
                  marginTop: 8, letterSpacing: '0.06em',
                }}>{p.stats}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ChannelToggle({ on, onChange, title, sub, recommended }) {
  return (
    <button type="button" className="hof-btn hof-press" onClick={() => onChange(!on)}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px',
              background: on ? HOF.elevated : HOF.bg,
              border: on ? `1px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
              borderRadius: 10,
            }}>
      <div style={{
        width: 34, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? HOF.amber : HOF.border,
        position: 'relative', transition: 'background 120ms',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 16, height: 16, borderRadius: 8, background: '#fff',
          transition: 'left 120ms ease-out',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>{title}</div>
          {recommended && <HofPill tone="amber" size="sm">Default</HofPill>}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

function Kpi({ label, value, delta, tone, progress }) {
  const toneC = { amber: HOF.amber, warning: HOF.warning, neutral: HOF.text, muted: HOF.textSec }[tone];
  return (
    <div style={{
      background: HOF.surface, border: `1px solid ${HOF.border}`,
      borderRadius: 12, padding: 16,
    }}>
      <div style={{
        fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
        color: HOF.text, marginTop: 6, letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{
        fontFamily: 'Inter', fontSize: 11, color: toneC, marginTop: 4,
      }}>{delta}</div>
      {progress !== undefined && (
        <div style={{
          marginTop: 10, height: 4, background: HOF.elevated, borderRadius: 2,
        }}>
          <div style={{ height: '100%', width: `${progress}%`, background: HOF.amber, borderRadius: 2 }}/>
        </div>
      )}
    </div>
  );
}

function TierBar({ name, sold, total, color, sub }) {
  const pct = sold / total * 100;
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6,
      }}>
        <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>{name}</span>
        <span style={{
          fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec,
          fontVariantNumeric: 'tabular-nums',
        }}>{sold} / {total}</span>
      </div>
      <div style={{ height: 6, background: HOF.elevated, borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }}/>
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function SalesChart() {
  // Simple SVG bar+line chart
  const data = [4, 6, 5, 9, 12, 18, 10, 14, 22, 31, 28, 20, 26, 18];
  const max = Math.max(...data);
  const cumulative = data.reduce((acc, v) => { acc.push((acc[acc.length-1] || 0) + v); return acc; }, []);
  const cumMax = cumulative[cumulative.length-1];
  return (
    <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none">
      <defs>
        <linearGradient id="adm-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={HOF.amber}/>
          <stop offset="100%" stopColor={HOF.ember}/>
        </linearGradient>
        <linearGradient id="adm-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={HOF.amber} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={HOF.amber} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* horizontal grid */}
      {[0.25, 0.5, 0.75].map(g => (
        <line key={g} x1="0" y1={180 * g} x2="400" y2={180 * g} stroke={HOF.border} strokeWidth="1"/>
      ))}
      {/* bars */}
      {data.map((v, i) => {
        const w = 400 / data.length, h = (v / max) * 130;
        return <rect key={i} x={i * w + 4} y={170 - h} width={w - 8} height={h} fill="url(#adm-bar)" rx="2"/>;
      })}
      {/* cumulative line */}
      {(() => {
        const pts = cumulative.map((v, i) => `${(i + 0.5) * (400 / data.length)},${170 - (v / cumMax) * 150}`).join(' ');
        const fillPath = `M 0,170 L ${pts} L 400,170 Z`;
        const linePath = `M ${pts.replace(/ /g, ' L ')}`;
        return <>
          <path d={fillPath} fill="url(#adm-fill)"/>
          <path d={linePath} stroke={HOF.text} strokeWidth="1.5" fill="none"/>
          {cumulative.map((v, i) => (
            <circle key={i} cx={(i + 0.5) * (400 / data.length)} cy={170 - (v / cumMax) * 150}
                    r="2.5" fill={HOF.text}/>
          ))}
        </>;
      })()}
    </svg>
  );
}

function GuestList() {
  const guests = [
    ['Sujan Bhuiyan',  'sujan@…', 'VIP',     'paid',    'Apr 16'],
    ['Mia Castellanos','mia@…',   'General', 'paid',    'Apr 15'],
    ['Devon Park',     'devon@…', 'General', 'paid',    'Apr 14'],
    ['Tara Reyes',     'tara@…',  'VIP',     'paid',    'Apr 14'],
    ['Khalil Stone',   'khalil@…','General', 'refund',  'Apr 12'],
    ['Iris Wong',      'iris@…',  'General', 'paid',    'Apr 11'],
  ];
  return (
    <div style={{
      background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${HOF.border}`,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Guest list</div>
          <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                        color: HOF.text, marginTop: 4 }}>253 confirmed · 6 of 253</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', background: HOF.elevated, border: `1px solid ${HOF.border}`,
          borderRadius: 8, width: 220,
        }}>
          <Icon name="search" size={14} color={HOF.textSec}/>
          <input placeholder="Search name or email…" style={{
            border: 0, background: 'transparent', outline: 'none',
            fontFamily: 'Inter', fontSize: 12, color: HOF.text, width: '100%',
          }}/>
        </div>
      </div>
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.7fr',
          padding: '10px 16px', borderBottom: `1px solid ${HOF.border}`,
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          <div>Name</div><div>Email</div><div>Tier</div><div>Status</div><div>Purchased</div>
        </div>
        {guests.map((g, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.7fr',
            padding: '12px 16px',
            borderBottom: i < guests.length - 1 ? `1px solid ${HOF.border}` : 'none',
            fontFamily: 'Inter', fontSize: 13, color: HOF.text, alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: HOF.elevated, border: `1px solid ${HOF.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter', fontSize: 11, fontWeight: 500, color: HOF.textSec,
              }}>{g[0].split(' ').map(p=>p[0]).join('')}</div>
              {g[0]}
            </div>
            <div style={{ color: HOF.textSec, fontSize: 12 }}>{g[1]}</div>
            <div>
              <HofPill tone={g[2] === 'VIP' ? 'gold' : 'neutral'} size="sm">{g[2]}</HofPill>
            </div>
            <div>
              <HofPill tone={g[3] === 'paid' ? 'success' : 'danger'} size="sm">{g[3]}</HofPill>
            </div>
            <div style={{ color: HOF.textSec, fontFamily: 'JetBrains Mono', fontSize: 11 }}>{g[4]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoReview() {
  return (
    <div style={{
      background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
      padding: 18,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Photo review</div>
          <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                        color: HOF.text, marginTop: 4 }}>4 pending</div>
        </div>
        <HofPill tone="warning" size="sm">From Ed 23</HofPill>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ position: 'relative' }}>
            <HofPhoto seed={i} gradient={false}
                      style={{ width: '100%', aspectRatio: '1/1', borderRadius: 8 }}/>
            <div style={{
              position: 'absolute', left: 6, bottom: 6, right: 6,
              display: 'flex', gap: 4,
            }}>
              <button className="hof-btn hof-press" style={{
                flex: 1, height: 26, background: HOF.success, color: HOF.bg, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
              }}>✓</button>
              <button className="hof-btn hof-press" style={{
                flex: 1, height: 26, background: 'rgba(20,20,18,0.85)', color: HOF.text,
                borderRadius: 4, backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
              }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenAdmin });

// ─── Moderation pane ────────────────────────────────────────────────────────
function AdminModerationPane() {
  const REPORTS = [
    { id: 'r1', kind: 'spam',         post: 'check out this site for cheap tix...', reporter: 'iris.w · member', author: 'newbie_42', age: '12m', severity: 'high' },
    { id: 'r2', kind: 'off-topic',    post: 'Anyone selling extra GA?', reporter: '3 members', author: 'devon', age: '2h', severity: 'low' },
  ];
  const QUEUE = [
    { id: 'q1', kind: 'first post',  body: "Hey! First time at HoF this Friday. Anyone meeting up beforehand?",
      author: 'newbie_42', channel: 'general', age: '8m' },
    { id: 'q2', kind: 'photo upload', body: "Edition 23 — my favorite shot of the night",
      author: 'mauro.k', channel: 'recap', age: '1d', hasPhoto: true },
  ];

  return (
    <>
      <div style={{
        padding: '22px 28px 18px', borderBottom: `1px solid ${HOF.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Moderation</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
          }}>Keep the board honest</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
            2 reports awaiting review · 2 posts in the first-post queue
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <HofButton variant="ghost" size="md">Mod log</HofButton>
          <HofButton variant="primary" size="md" icon={<Icon name="user" size={14} color={HOF.bg}/>}>
            Promote to Crew
          </HofButton>
        </div>
      </div>

      <div style={{
        padding: '20px 28px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
      }}>
        {/* Reports queue */}
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Reported posts</div>
            <HofPill tone="danger" size="sm">{REPORTS.length} pending</HofPill>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REPORTS.map(r => <ReportCard key={r.id} r={r}/>)}
          </div>
        </div>

        {/* First-post queue */}
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>First-post queue</div>
            <HofPill tone="amber" size="sm">{QUEUE.length} waiting</HofPill>
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginBottom: 12, lineHeight: 1.5 }}>
            New members' first post gets a quick check before it hits the board. Keeps spam out without slowing the regulars.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUEUE.map(q => <QueueCard key={q.id} q={q}/>)}
          </div>
        </div>
      </div>

      {/* Pinned posts management */}
      <div style={{ padding: '0 28px 28px' }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Pinned posts</div>
            <span style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec }}>
              Max 3 pinned per channel
            </span>
          </div>
          {HOF_POSTS.filter(p => p.pinned).map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
              borderBottom: `1px solid ${HOF.border}`,
            }}>
              <Icon name="pin" size={14} color={HOF.amber}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>
                  {p.title || p.body.slice(0, 50)}
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2,
                              display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChannelTag id={p.channel}/> · {p.author.name} · {p.time} ago
                </div>
              </div>
              <HofButton variant="ghost" size="sm">Unpin</HofButton>
            </div>
          ))}
          {HOF_POSTS.filter(p => p.pinned).length === 0 && (
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, padding: '12px 0' }}>
              Nothing pinned. Pinning a post from #general makes it the top item on every member's home feed.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ReportCard({ r }) {
  return (
    <div style={{
      padding: 14, background: HOF.bg, border: `1px solid ${HOF.border}`,
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <HofPill tone={r.severity === 'high' ? 'danger' : 'warning'} size="sm">{r.kind}</HofPill>
        <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>
          Reported by {r.reporter} · {r.age} ago
        </span>
      </div>
      <div style={{
        padding: '10px 12px',
        background: HOF.elevated, borderRadius: 8,
        fontFamily: 'Inter', fontSize: 13, color: HOF.text,
        fontStyle: 'italic', lineHeight: 1.5,
      }}>"{r.post}"</div>
      <div style={{
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 8,
      }}>by <span style={{ color: HOF.text, fontWeight: 500 }}>{r.author}</span></div>
      <div style={{
        display: 'flex', gap: 6, marginTop: 12, paddingTop: 10,
        borderTop: `1px solid ${HOF.border}`,
      }}>
        <HofButton variant="quiet"  size="sm">Dismiss</HofButton>
        <HofButton variant="ghost"  size="sm">Hide post</HofButton>
        <HofButton variant="danger" size="sm">Ban author</HofButton>
      </div>
    </div>
  );
}

function QueueCard({ q }) {
  return (
    <div style={{
      padding: 14, background: HOF.bg, border: `1px solid ${HOF.border}`,
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <HofPill tone="amber" size="sm">{q.kind}</HofPill>
        <ChannelTag id={q.channel}/>
        <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>· {q.age} ago</span>
      </div>
      <div style={{
        fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.5,
      }}>{q.body}</div>
      {q.hasPhoto && (
        <div style={{ marginTop: 8, height: 80, borderRadius: 6, overflow: 'hidden' }}>
          <HofPhoto seed={0} gradient={false} style={{ width: '100%', height: '100%' }}/>
        </div>
      )}
      <div style={{
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 8,
      }}>by <span style={{ color: HOF.text, fontWeight: 500 }}>{q.author}</span></div>
      <div style={{
        display: 'flex', gap: 6, marginTop: 12, paddingTop: 10,
        borderTop: `1px solid ${HOF.border}`,
      }}>
        <HofButton variant="primary" size="sm" icon={<Icon name="check" size={12} color={HOF.bg}/>}>Approve</HofButton>
        <HofButton variant="ghost"   size="sm">Edit & approve</HofButton>
        <HofButton variant="danger"  size="sm">Reject</HofButton>
      </div>
    </div>
  );
}


// ─── Admin Events list pane ─────────────────────────────────────────────────
function AdminEventsPane() {
  const EVENTS = [
    { ed: 24, name: 'Fireversary',          date: 'Jun 26, 2026', status: 'live',    sold: 253, cap: 300, gross: '$7,684' },
    { ed: 25, name: 'Mid-Summer Burn',      date: 'Jul 24, 2026', status: 'draft',   sold: 0,   cap: 300, gross: '—' },
    { ed: 23, name: 'Late Bloom',           date: 'May 30, 2026', status: 'past',    sold: 300, cap: 300, gross: '$8,940' },
    { ed: 22, name: 'Slow Burn',            date: 'Apr 25, 2026', status: 'past',    sold: 300, cap: 300, gross: '$8,940' },
    { ed: 21, name: 'The Equinox',          date: 'Mar 28, 2026', status: 'past',    sold: 286, cap: 300, gross: '$8,512' },
    { ed: 20, name: 'Year Two Open',        date: 'Feb 28, 2026', status: 'past',    sold: 300, cap: 300, gross: '$8,400' },
  ];
  const [filter, setFilter] = React.useState('all');
  const filtered = filter === 'all' ? EVENTS : EVENTS.filter(e => e.status === filter);

  return (
    <>
      <div style={{
        padding: '22px 28px 18px', borderBottom: `1px solid ${HOF.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Events</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
          }}>All editions</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
            24 editions to date · 1 draft · 1 live
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <HofButton variant="ghost" size="md">Duplicate last edition</HofButton>
          <HofButton variant="primary" size="md" icon={<Icon name="plus" size={14} color={HOF.bg}/>}>
            New edition
          </HofButton>
        </div>
      </div>

      <div style={{ padding: '16px 28px 0', display: 'flex', gap: 4 }}>
        {[['all','All'],['live','Live'],['draft','Drafts'],['past','Past']].map(([k,l]) => (
          <button key={k} className="hof-btn" onClick={() => setFilter(k)}
                  style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: filter === k ? HOF.elevated : 'transparent',
                    border: `1px solid ${filter === k ? HOF.border : 'transparent'}`,
                    fontFamily: 'Inter', fontSize: 12, color: filter === k ? HOF.text : HOF.textSec,
                    fontWeight: 500,
                  }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '14px 28px 28px' }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 2fr 1fr 0.7fr 1.2fr 1fr 80px',
            padding: '12px 18px', borderBottom: `1px solid ${HOF.border}`,
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            <div>Ed</div><div>Name</div><div>Date</div><div>Status</div><div>Sold</div><div>Gross</div><div></div>
          </div>
          {filtered.map((e, i) => (
            <div key={e.ed} style={{
              display: 'grid', gridTemplateColumns: '60px 2fr 1fr 0.7fr 1.2fr 1fr 80px',
              padding: '14px 18px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? `1px solid ${HOF.border}` : 'none',
              fontFamily: 'Inter', fontSize: 13, color: HOF.text,
            }}>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                color: HOF.text, letterSpacing: '-0.01em',
              }}>{e.ed}</div>
              <div style={{ fontFamily: 'Inter', fontWeight: 500 }}>{e.name}</div>
              <div style={{ color: HOF.textSec, fontFamily: 'JetBrains Mono', fontSize: 12 }}>{e.date}</div>
              <div>
                <HofPill tone={e.status === 'live' ? 'amber' : e.status === 'draft' ? 'neutral' : 'success'} size="sm">
                  {e.status}
                </HofPill>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: HOF.text,
                              fontVariantNumeric: 'tabular-nums' }}>{e.sold} / {e.cap}</div>
                <div style={{ height: 4, background: HOF.elevated, borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${(e.sold / e.cap) * 100}%`,
                                background: e.status === 'live' ? HOF.amber : HOF.borderHi, borderRadius: 2 }}/>
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.text,
                            fontVariantNumeric: 'tabular-nums' }}>{e.gross}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Icon name="chev" size={14} color={HOF.textSec}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Admin Members directory pane ───────────────────────────────────────────
function AdminMembersPane() {
  const MEMBERS = [
    { name: 'Sujan Bhuiyan',   email: 'sujan@…',  tier: 'VIP',    role: 'member', joined: 'Apr 24', editions: 12, lastSeen: 'Ed 23', posts: 8,  flag: '' },
    { name: 'Mia Castellanos', email: 'mia@…',    tier: 'GA',     role: 'member', joined: 'Jan 25', editions: 6,  lastSeen: 'Ed 23', posts: 24, flag: '' },
    { name: 'Devon Park',      email: 'devon@…',  tier: 'GA',     role: 'member', joined: 'Mar 25', editions: 4,  lastSeen: 'Ed 23', posts: 41, flag: '' },
    { name: 'Tara Reyes',      email: 'tara@…',   tier: 'VIP',    role: 'member', joined: 'Jun 24', editions: 11, lastSeen: 'Ed 22', posts: 5,  flag: '' },
    { name: 'iris.w',          email: 'iris@…',   tier: 'GA',     role: 'member', joined: 'Sep 25', editions: 2,  lastSeen: 'Ed 23', posts: 17, flag: 'new' },
    { name: 'Jordan Groth',    email: 'j@…',      tier: 'Owner',  role: 'crew',   joined: 'Jan 24', editions: 24, lastSeen: 'Ed 23', posts: 86, flag: '' },
    { name: 'Mauro K.',        email: 'mauro@…',  tier: 'GA',     role: 'crew',   joined: 'Jan 24', editions: 22, lastSeen: 'Ed 23', posts: 14, flag: 'photographer' },
    { name: 'newbie_42',       email: 'spam@…',   tier: 'GA',     role: 'member', joined: '6 days', editions: 0,  lastSeen: '—',     posts: 1,  flag: 'flagged' },
  ];

  return (
    <>
      <div style={{
        padding: '22px 28px 18px', borderBottom: `1px solid ${HOF.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Members</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
          }}>1,247 members</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
            +34 this month · 62% return rate · 4 Crew · 2 Photographers
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', background: HOF.surface, border: `1px solid ${HOF.border}`,
          borderRadius: 8, width: 260,
        }}>
          <Icon name="search" size={14} color={HOF.textSec}/>
          <input placeholder="Search name, email, phone…" style={{
            border: 0, background: 'transparent', outline: 'none',
            fontFamily: 'Inter', fontSize: 12, color: HOF.text, width: '100%',
          }}/>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{
        padding: '20px 28px 0',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        <Kpi label="Total members"   value="1,247"  delta="+34 this month" tone="amber"/>
        <Kpi label="Active (90 day)" value="824"    delta="66% of total"   tone="neutral"/>
        <Kpi label="Return rate"     value="62%"    delta="+4% YoY"        tone="amber"/>
        <Kpi label="Crew & comp"     value="6"      delta="4 Crew · 2 Photographers" tone="muted"/>
      </div>

      <div style={{ padding: '20px 28px 28px' }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.8fr 1fr 80px',
            padding: '12px 18px', borderBottom: `1px solid ${HOF.border}`,
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            <div>Member</div><div>Email</div><div>Tier</div><div>Editions</div><div>Last seen</div><div>Posts</div><div></div>
          </div>
          {MEMBERS.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.8fr 1fr 80px',
              padding: '12px 18px', alignItems: 'center',
              borderBottom: i < MEMBERS.length - 1 ? `1px solid ${HOF.border}` : 'none',
              fontFamily: 'Inter', fontSize: 13, color: HOF.text,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar initials={m.name.split(' ').map(s => s[0]).join('').slice(0, 2)}
                        role={m.role} size={28}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    {m.role === 'crew' && <HofPill tone="crew" size="sm">Crew</HofPill>}
                    {m.flag === 'flagged' && <HofPill tone="danger" size="sm">Flagged</HofPill>}
                    {m.flag === 'new' && <HofPill tone="amber" size="sm">New</HofPill>}
                    {m.flag === 'photographer' && <HofPill tone="gold" size="sm">📷 Photo</HofPill>}
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textDis,
                  }}>Joined {m.joined}</div>
                </div>
              </div>
              <div style={{ color: HOF.textSec, fontSize: 12,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
              <div>
                <HofPill tone={m.tier === 'VIP' || m.tier === 'Owner' ? 'gold' : 'neutral'} size="sm">{m.tier}</HofPill>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{m.editions}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: HOF.textSec }}>{m.lastSeen}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{m.posts}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Icon name="chev" size={14} color={HOF.textSec}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}


// ─── Admin Discount codes + Financials views ────────────────────────────────
function AdminCodesPane() {
  const codes = [
    { code: 'CREW-MAURO', kind: 'Comp',     pct: '100%', uses: '8 / ∞',   note: 'Photographer comps' },
    { code: 'BOULDER-15', kind: 'Discount', pct: '15%',  uses: '47 / 100', note: 'Local partner code' },
    { code: 'PLUS-ONE',   kind: 'Discount', pct: '$10',  uses: '12 / 50',  note: 'For member referrals' },
    { code: 'PRESS-24',   kind: 'Comp',     pct: '100%', uses: '3 / 10',   note: 'Press passes Ed 24' },
  ];
  return (
    <>
      <PaneHeader title="Codes & comps" sub="Discount codes, comp tickets, press passes — keep the door honest."
                  cta={<HofButton variant="primary" size="md" icon={<Icon name="plus" size={14} color={HOF.bg}/>}>New code</HofButton>}/>
      <div style={{ padding: '20px 28px 28px' }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 2fr 80px',
            padding: '12px 18px', borderBottom: `1px solid ${HOF.border}`,
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            <div>Code</div><div>Kind</div><div>Value</div><div>Uses</div><div>Notes</div><div></div>
          </div>
          {codes.map((c, i) => (
            <div key={c.code} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 2fr 80px',
              padding: '14px 18px', alignItems: 'center',
              borderBottom: i < codes.length - 1 ? `1px solid ${HOF.border}` : 'none',
              fontFamily: 'Inter', fontSize: 13, color: HOF.text,
            }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.text, fontWeight: 600,
                            letterSpacing: '0.04em' }}>{c.code}</div>
              <div>
                <HofPill tone={c.kind === 'Comp' ? 'gold' : 'amber'} size="sm">{c.kind}</HofPill>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontVariantNumeric: 'tabular-nums' }}>{c.pct}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: HOF.textSec, fontVariantNumeric: 'tabular-nums' }}>{c.uses}</div>
              <div style={{ color: HOF.textSec, fontSize: 12 }}>{c.note}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Icon name="chev" size={14} color={HOF.textSec}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24, padding: '16px 18px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>Comp-ticket pool</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              ['Crew',       '4 / 8',  'Photographers, helpers'],
              ['Press',      '3 / 10', 'Reviewers, podcasts'],
              ['Goodwill',   '2 / 5',  'On-the-spot, Jordan\'s call'],
            ].map(([l, v, s]) => (
              <div key={l}>
                <div style={{ fontFamily: 'Inter', fontSize: 10, color: HOF.textSec, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 24, color: HOF.text, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Admin Financials ───────────────────────────────────────────────────────
function AdminFinancialsPane() {
  return (
    <>
      <PaneHeader title="Financials"
                  sub="Money in, money out. Per edition and rolling."
                  cta={<HofButton variant="ghost" size="md" icon={<Icon name="download" size={14} color={HOF.text}/>}>Export</HofButton>}/>

      <div style={{ padding: '20px 28px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Edition 24 gross"   value="$7,684"  delta="+$840 from Tap-to-Pay walk-ups" tone="amber"/>
          <Kpi label="Edition 24 net"     value="$5,234"  delta="68% margin" tone="neutral"/>
          <Kpi label="YTD gross"          value="$58,420" delta="+12% YoY"  tone="amber"/>
          <Kpi label="Open refund req."   value="1"       delta="Action needed" tone="warning"/>
        </div>
      </div>

      <div style={{
        padding: '20px 28px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16,
      }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>By edition · last 6</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
            color: HOF.text, marginTop: 4,
          }}>Steady right-up-and-to-the-right</div>

          {/* Bar chart */}
          <div style={{
            marginTop: 18, display: 'flex', gap: 14, alignItems: 'flex-end', height: 180,
          }}>
            {[
              { ed: 19, gross: 5200 }, { ed: 20, gross: 5800 }, { ed: 21, gross: 6400 },
              { ed: 22, gross: 7100 }, { ed: 23, gross: 7900 }, { ed: 24, gross: 7684, active: true },
            ].map(b => (
              <div key={b.ed} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: '100%', height: `${(b.gross / 8000) * 100}%`,
                  background: b.active
                    ? `linear-gradient(180deg, ${HOF.amber}, ${HOF.ember})`
                    : 'linear-gradient(180deg, #3a3835, #2a2826)',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 6,
                }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono', fontSize: 10, color: b.active ? HOF.bg : HOF.text,
                    fontWeight: 600,
                  }}>{`$${(b.gross / 1000).toFixed(1)}k`}</span>
                </div>
                <span style={{
                  fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>Ed {b.ed}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14,
          }}>Ed 24 breakdown</div>
          {[
            { l: 'GA × 143',    v: '$4,004', pct: 52, color: HOF.amber },
            { l: 'Early × 80',  v: '$1,600', pct: 21, color: HOF.glow },
            { l: 'VIP × 30',    v: '$1,650', pct: 21, color: HOF.gold },
            { l: 'Door × 14',   v: '$430',   pct: 6,  color: HOF.borderHi },
          ].map(r => (
            <div key={r.l} style={{ marginBottom: 12 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontFamily: 'Inter', fontSize: 12,
              }}>
                <span style={{ color: HOF.text, fontWeight: 500 }}>{r.l}</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: HOF.text, fontVariantNumeric: 'tabular-nums' }}>{r.v}</span>
              </div>
              <div style={{ marginTop: 5, height: 5, background: HOF.elevated, borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${r.pct * 1.7}%`, background: r.color, borderRadius: 3 }}/>
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: `1px solid ${HOF.border}`,
            display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 13,
          }}>
            <span style={{ color: HOF.textSec }}>Stripe fees</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: HOF.text, fontVariantNumeric: 'tabular-nums' }}>−$262</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 13, marginTop: 6,
          }}>
            <span style={{ color: HOF.textSec }}>Venue cut (30%)</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: HOF.text, fontVariantNumeric: 'tabular-nums' }}>−$2,188</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 14,
            marginTop: 8, paddingTop: 8, borderTop: `1px solid ${HOF.border}`,
            color: HOF.text, fontWeight: 500,
          }}>
            <span>Net</span>
            <span style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18, color: HOF.amber,
                          fontVariantNumeric: 'tabular-nums' }}>$5,234</span>
          </div>
        </div>
      </div>

      {/* Refund queue */}
      <div style={{ padding: '0 28px 28px' }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 18,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
          }}>
            <div>
              <div style={{
                fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>Refund requests</div>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                color: HOF.text, marginTop: 4,
              }}>1 pending</div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 14px', background: HOF.bg,
            border: `1px solid ${HOF.border}`, borderRadius: 10,
          }}>
            <Avatar initials="KS" role="member" size={32}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>
                Khalil Stone · GA · $28
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2,
                            fontStyle: 'italic', lineHeight: 1.4 }}>
                "Emergency — family thing came up the day before. Tried to transfer, no one bit. Apologies."
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <HofButton variant="ghost" size="sm">Reply</HofButton>
              <HofButton variant="primary" size="sm">Refund $28</HofButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PaneHeader({ title, sub, cta }) {
  return (
    <div style={{
      padding: '22px 28px 18px', borderBottom: `1px solid ${HOF.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>Admin</div>
        <div style={{
          fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
          color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
        }}>{title}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>{sub}</div>}
      </div>
      {cta}
    </div>
  );
}
