// screen-landing.jsx — Unauthenticated landing (what a stranger sees before sign-up)

function ScreenLanding({ onGetStarted, onSignIn }) {
  return (
    <HofScreen>
      <HofScroll>
        {/* Hero */}
        <div style={{ position: 'relative', height: 620, overflow: 'hidden' }}>
          <img src="assets/photos/p3-portal-dj.jpg" alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 35%',
          }}/>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(232,101,26,0.0) 0%, rgba(10,10,8,0.55) 70%, #0A0A08 100%)',
          }}/>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 420,
            background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,8,0.92) 50%, #0A0A08 100%)',
          }}/>

          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 54, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HofLogoMark size={22}/>
              <span style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 12,
                letterSpacing: '0.22em', color: HOF.text, textTransform: 'uppercase',
              }}>House of Fire</span>
            </div>
            <button className="hof-btn hof-press" onClick={onSignIn} style={{
              fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: HOF.text,
              padding: '8px 14px', borderRadius: 6,
              background: 'rgba(20,20,18,0.6)', backdropFilter: 'blur(10px)',
              border: `1px solid ${HOF.border}`,
            }}>Sign in</button>
          </div>

          {/* Hero copy */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 28, padding: '0 20px',
          }}>
            <HofPill tone="amber" size="sm">Boulder · Monthly</HofPill>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 700, fontSize: 44,
              color: HOF.text, marginTop: 14, letterSpacing: '-0.02em',
              lineHeight: 0.95, textTransform: 'uppercase', textWrap: 'balance',
            }}>
              The room that keeps the floor full.
            </div>
            <div style={{
              fontFamily: 'Inter', fontSize: 15, color: HOF.textSec, marginTop: 14,
              lineHeight: 1.5, textWrap: 'pretty', maxWidth: 320,
            }}>
              Underground house and techno. One room. One night a month. Tickets sell out, every time. <span style={{ color: HOF.text }}>You should be here.</span>
            </div>
          </div>
        </div>

        {/* Primary CTAs */}
        <div style={{ padding: '24px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <HofButton variant="primary" full onClick={onGetStarted}
                     icon={<Icon name="flame" size={18} color={HOF.bg}/>}>
            Become a member — free
          </HofButton>
          <HofButton variant="ghost" full onClick={onGetStarted}>
            Browse the next event
          </HofButton>
        </div>

        {/* Trust strip */}
        <div style={{
          margin: '24px 16px 0', padding: '16px 18px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {[['24', 'themes'], ['7,200+', 'attended'], ['62%', 'return rate']].map(([n, l]) => (
            <div key={l}>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: HOF.text,
              }}>{n}</div>
              <div style={{
                fontFamily: 'Inter', fontSize: 10, color: HOF.textSec, marginTop: 2,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>{l}</div>
            </div>
          ))}
        </div>

        {/* What it is */}
        <div style={{ padding: '32px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>What it is</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 500, fontSize: 22, lineHeight: 1.25,
            color: HOF.text, letterSpacing: '-0.01em', textWrap: 'pretty',
          }}>
            A monthly gathering of the people who keep coming back. Underground house and techno. One room. Always at the Junkyard.
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: '32px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14,
          }}>How it works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['01', 'Become a member', 'Free. 30 seconds. Email + phone.'],
              ['02', 'Buy a ticket', 'Theme by theme. They go fast.'],
              ['03', 'Show your QR at the door', "Don't lose it. Don't share it."],
              ['04', 'Find your people', 'Channels, recaps, photos, the whole house.'],
            ].map(([n, t, s]) => (
              <div key={n} style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 28,
                  color: HOF.amber, lineHeight: 1, letterSpacing: '-0.02em',
                  width: 40, flexShrink: 0,
                }}>{n}</div>
                <div>
                  <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: HOF.text }}>{t}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 2 }}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent photos */}
        <div style={{ padding: '32px 0 0' }}>
          <div style={{
            padding: '0 16px', marginBottom: 12,
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>From the last 3 themes</div>
          <div className="hof-scroll" style={{
            display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px',
          }}>
            {[0, 1, 2, 3, 0, 1].map((s, i) => (
              <HofPhoto key={i} seed={s}
                        style={{ flex: '0 0 auto', width: 200, height: 260, borderRadius: 10 }}/>
            ))}
          </div>
        </div>

        {/* Pinned CTA */}
        <div style={{ padding: '32px 16px 16px' }}>
          <div style={{
            padding: 22, borderRadius: 14, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, rgba(232,101,26,0.15) 0%, ${HOF.surface} 60%)`,
            border: `1px solid ${HOF.border}`,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Next theme</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
              color: HOF.text, marginTop: 6, letterSpacing: '-0.01em',
            }}>Fireversary — Theme 24</div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 6 }}>
              Friday, June 26 · Junkyard · 47 GA tickets left
            </div>
            <div style={{ marginTop: 16 }}>
              <HofButton variant="primary" full onClick={onGetStarted}
                         icon={<Icon name="ticket" size={16} color={HOF.bg}/>}>
                Sign up & get tickets
              </HofButton>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 16px 40px', textAlign: 'center',
          fontFamily: 'Inter', fontSize: 11, color: HOF.textDis,
          letterSpacing: '0.12em',
        }}>
          houseoffire.events · Boulder, CO
        </div>
      </HofScroll>
    </HofScreen>
  );
}

Object.assign(window, { ScreenLanding });
