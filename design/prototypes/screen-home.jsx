// screen-home.jsx — Home: upcoming event hero, countdown, CTA, past photos strip

function ScreenHome({ nav, onOpenEvent, onOpenCheckout, onOpenPost }) {
  const [now, setNow] = React.useState(Date.now());
  const [calOpen, setCalOpen] = React.useState(false);
  const [notifsOpen, setNotifsOpen] = React.useState(false);
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // event date: Friday, June 26, 2026, 8:00 PM MT (UTC-6, treat as -06:00)
  const eventTs = Date.parse('2026-06-26T20:00:00-06:00');
  const ms = Math.max(0, eventTs - now);
  const dd = Math.floor(ms / 86400000);
  const hh = Math.floor(ms / 3600000) % 24;
  const mm = Math.floor(ms / 60000) % 60;
  const ss = Math.floor(ms / 1000) % 60;

  return (
    <HofScreen>
      {/* Sticky transparent top */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HofLogoMark size={26}/>
          <span style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 14,
            letterSpacing: '0.18em', color: HOF.text, textTransform: 'uppercase',
          }}>House of Fire</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="hof-btn hof-press" onClick={() => setCalOpen(true)}
                aria-label="Add to calendar"
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  background: 'rgba(20,20,18,0.7)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${HOF.border}`, position: 'relative',
                }}>
          <Icon name="calendar" size={18} color={HOF.text}/>
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 14, height: 14, borderRadius: 7,
            background: HOF.amber, color: HOF.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter', fontSize: 11, fontWeight: 700, lineHeight: 1,
            border: `2px solid ${HOF.bg}`,
          }}>+</span>
        </button>
        <button className="hof-btn hof-press" onClick={() => setNotifsOpen(true)} style={{
          width: 38, height: 38, borderRadius: 19,
          background: 'rgba(20,20,18,0.7)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${HOF.border}`, position: 'relative',
        }}>
          <Icon name="bell" size={18} color={HOF.text}/>
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 8, height: 8, borderRadius: 4,
            background: HOF.amber, border: `2px solid rgba(20,20,18,0.85)`,
          }}/>
        </button>
        </div>
      </div>

      <HofScroll>
        {/* Hero */}
        <div style={{ position: 'relative', height: 540, overflow: 'hidden' }}>
          <img src="assets/photos/p1-laser-dj.jpg" alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
          }}/>
          {/* warm vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(232,101,26,0.0) 0%, rgba(10,10,8,0.5) 75%, #0A0A08 100%)',
          }}/>
          {/* bottom gradient */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 360,
            background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,8,0.85) 50%, #0A0A08 100%)',
          }}/>

          {/* Hero content overlay */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '0 20px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <HofPill tone="warning">
                <span style={{
                  width: 5, height: 5, borderRadius: 5, background: HOF.bg, marginRight: 1,
                  animation: 'hof-pulse 1.4s ease-in-out infinite',
                }}/>
                Selling Fast · 47 left
              </HofPill>
              <HofPill tone="neutral">Edition № 24</HofPill>
            </div>
            {/* Real HoF wordmark — feels like an album title */}
            <img src="assets/hof-logo-color.png" alt="House of Fire"
                 style={{
                   width: 'auto', height: 96, display: 'block', marginLeft: -6,
                   filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.5))',
                 }}/>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
              color: HOF.text, marginTop: 10, letterSpacing: '-0.01em',
              lineHeight: 1, textTransform: 'uppercase',
            }}>
              Fireversary<br/>
              <span style={{ color: HOF.glow, fontWeight: 500 }}>2-Year Anniversary</span>
            </div>
            <div style={{
              fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 14,
              letterSpacing: '0.04em',
            }}>
              Friday, June 26 · Junkyard Social Club · Boulder, CO
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div style={{ padding: '24px 16px 8px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12,
          }}>Doors in</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[['Days', dd], ['Hours', hh], ['Min', mm], ['Sec', ss]].map(([l, v]) => (
              <div key={l} style={{
                background: HOF.surface, border: `1px solid ${HOF.border}`,
                borderRadius: 12, padding: '14px 8px 10px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 30,
                  color: HOF.text, lineHeight: 1, letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>{String(v).padStart(2, '0')}</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                  textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 6,
                }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <HofButton variant="primary" full onClick={onOpenCheckout}
                     icon={<Icon name="ticket" size={18} color={HOF.bg}/>}>
            Get Tickets — from $20
          </HofButton>
          <HofButton variant="ghost" full onClick={onOpenEvent}>
            Event details
          </HofButton>
        </div>

        {/* Trust strip */}
        <div style={{
          margin: '24px 16px 0', padding: '16px 18px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {[
            ['24', 'editions'],
            ['7,200+', 'attended'],
            ['62%', 'return rate'],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
                color: HOF.text, letterSpacing: '-0.01em',
              }}>{n}</div>
              <div style={{
                fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
                textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2,
              }}>{l}</div>
            </div>
          ))}
        </div>

        {/* About */}
        <div style={{ padding: '28px 16px 8px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>What it is</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 500, fontSize: 22, lineHeight: 1.25,
            color: HOF.text, letterSpacing: '-0.01em', textWrap: 'pretty',
          }}>
            A monthly gathering of the people who keep coming back. Underground house and techno. One room. One night a month. Always at the Junkyard.
          </div>
        </div>

        {/* From the house — discussion / announcement feed */}
        <FromTheHouse onOpenPost={onOpenPost}/>

        {/* From the last night strip */}
        <div style={{ padding: '28px 0 16px' }}>
          <div style={{
            padding: '0 16px', display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div>
              <div style={{
                fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                letterSpacing: '0.22em', textTransform: 'uppercase',
              }}>From the last night</div>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
                color: HOF.text, marginTop: 4, letterSpacing: '-0.01em',
              }}>Edition 23 · May 30</div>
            </div>
            <span style={{
              fontFamily: 'Inter', fontSize: 13, color: HOF.amber, fontWeight: 500,
            }}>See all →</span>
          </div>
          <div className="hof-scroll" style={{
            display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px',
          }}>
            {[0, 1, 2, 3, 0].map((i, idx) => (
              <HofPhoto key={idx} seed={i} label={`23 · ${String(idx+1).padStart(3,'0')}`}
                        style={{ flex: '0 0 auto', width: 150, height: 200, borderRadius: 10 }}/>
            ))}
          </div>
        </div>

        {/* Newsletter / quiet CTA */}
        <div style={{
          margin: '16px 16px 24px', padding: '20px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
        }}>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18, color: HOF.text,
            letterSpacing: '-0.01em', marginBottom: 6,
          }}>The Smoke Signal</div>
          <div style={{
            fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, lineHeight: 1.5,
            marginBottom: 14,
          }}>One short message before each edition. Lineup, doors, dress code. Nothing else.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="email" placeholder="you@example.com" style={{
              flex: 1, height: 44, padding: '0 14px',
              background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
              fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
            }}/>
            <HofButton variant="primary" size="md">Subscribe</HofButton>
          </div>
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      <HofBottomNav active="home" onChange={nav}/>

      <CalendarSheet open={calOpen} onClose={() => setCalOpen(false)}/>
      <NotificationsScreen open={notifsOpen}
                           onClose={() => setNotifsOpen(false)}
                           onOpenPost={(id) => { setNotifsOpen(false); onOpenPost && onOpenPost(id); }}/>
    </HofScreen>
  );
}

Object.assign(window, { ScreenHome });

// ─── "From the house" — uses shared FeedPost from posts-data.jsx ────────────
function FromTheHouse({ onOpenPost }) {
  // Top 3 posts from #general + #recap (already pinned-first in HOF_POSTS)
  const posts = HOF_POSTS.slice(0, 3);

  return (
    <div style={{ padding: '32px 0 8px' }}>
      <div style={{
        padding: '0 16px', display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>From the house</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
            color: HOF.text, marginTop: 4, letterSpacing: '-0.01em',
          }}>What we're saying</div>
        </div>
        <button className="hof-btn" onClick={() => onOpenPost && onOpenPost('community')}
                style={{
                  fontFamily: 'Inter', fontSize: 13, color: HOF.amber, fontWeight: 500,
                }}>
          Open board →
        </button>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map(p => (
          <FeedPost key={p.id} post={p}
                    onOpen={() => onOpenPost && onOpenPost(p.id)}/>
        ))}
      </div>
    </div>
  );
}
