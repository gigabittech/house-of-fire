// screen-profile.jsx — Member profile

function ScreenProfile({ nav, onOpenTicket, onOpenPost, onOpenSettings, startTab = 'overview' }) {
  const [tab, setTab] = React.useState(startTab);
  return (
    <HofScreen>
      <HofScroll>
        {/* Status bar offset + header */}
        <div style={{ height: 54 }}/>

        <div style={{
          padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26, color: HOF.text,
            letterSpacing: '-0.01em',
          }}>Profile</div>
          <button className="hof-btn hof-press" style={{
            width: 38, height: 38, borderRadius: 19,
            background: HOF.surface, border: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="settings" size={18} color={HOF.text}/>
          </button>
        </div>

        {/* Identity card */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{
            position: 'relative',
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 16,
            padding: 20, overflow: 'hidden',
          }}>
            {/* warm glow */}
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              borderRadius: 100,
              background: 'radial-gradient(circle, rgba(232,101,26,0.18), transparent 70%)',
              pointerEvents: 'none',
            }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32, flexShrink: 0,
                background: `linear-gradient(135deg, ${HOF.amber}, ${HOF.ember})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Clash Display', fontWeight: 700, fontSize: 28, color: HOF.bg,
                letterSpacing: '-0.02em',
              }}>SB</div>
              <div>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: HOF.text,
                  letterSpacing: '-0.01em',
                }}>Sujan Bhuiyan</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
                }}>@nightowl · Member since Apr 2024</div>
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    background: 'rgba(201,148,42,0.1)',
                    border: `1px solid ${HOF.gold}`,
                    borderRadius: 4,
                    fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                    color: HOF.gold, letterSpacing: '0.16em', textTransform: 'uppercase',
                  }}>
                    <Icon name="star" size={10} color={HOF.gold}/>
                    VIP Member
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              marginTop: 18, padding: '14px 0 0', borderTop: `1px solid ${HOF.border}`,
              position: 'relative',
            }}>
              {[
                ['12', 'Themes'],
                ['38', 'Photos'],
                ['85%', 'Attended'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div style={{
                    fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: HOF.text,
                    letterSpacing: '-0.01em',
                  }}>{n}</div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 10, color: HOF.textSec, marginTop: 2,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                  }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', gap: 4, padding: 4,
                        background: HOF.surface, border: `1px solid ${HOF.border}`,
                        borderRadius: 8 }}>
            {[['overview', 'Overview'], ['posts', 'Posts']].map(([k, l]) => (
              <button key={k} className="hof-btn hof-press" onClick={() => setTab(k)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 6,
                        background: tab === k ? HOF.elevated : 'transparent',
                        fontFamily: 'Inter', fontSize: 13, fontWeight: 500,
                        color: tab === k ? HOF.text : HOF.textSec,
                      }}>{l}</button>
            ))}
          </div>
        </div>

        {tab === 'posts' && <ProfilePosts onOpenPost={onOpenPost}/>}

        {tab === 'overview' && <>
        {/* Active ticket — sticky-style */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>Upcoming ticket</div>
          <button className="hof-btn hof-press" onClick={onOpenTicket} style={{
            width: '100%', textAlign: 'left', padding: 0,
            background: HOF.surface, border: `1px solid ${HOF.border}`,
            borderRadius: 12, overflow: 'hidden', display: 'block',
          }}>
            <div style={{ display: 'flex' }}>
              <div style={{
                width: 96, background: `linear-gradient(135deg, ${HOF.ember}, ${HOF.amber})`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 12, color: HOF.bg,
              }}>
                <div style={{
                  fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.16em',
                }}>Jun</div>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 700, fontSize: 38,
                  lineHeight: 1, letterSpacing: '-0.02em', marginTop: 2,
                }}>26</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 2,
                }}>FRI</div>
              </div>
              <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontFamily: 'Clash Display', fontWeight: 600, fontSize: 16, color: HOF.text,
                  }}>Fireversary · Th 24</div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
                  }}>Junkyard Social Club · 8 PM</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HofPill tone="amber" size="sm"><Icon name="qr" size={10} color={HOF.glow}/> Tap to open QR</HofPill>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* History */}
        <div style={{ padding: '28px 16px 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Past tickets</div>
            <span style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.amber }}>View all 12 →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { d: '23', m: 'May', y: '2026', n: 'Th 23 · Late Bloom', t: 'GA', a: true },
              { d: '25', m: 'Apr', y: '2026', n: 'Th 22 · Slow Burn', t: 'VIP', a: true },
              { d: '28', m: 'Mar', y: '2026', n: 'Th 21 · The Equinox', t: 'GA', a: false },
            ].map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: HOF.elevated, border: `1px solid ${HOF.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 8, color: HOF.textSec,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>{it.m}</div>
                  <div style={{
                    fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18, color: HOF.text,
                    lineHeight: 1, marginTop: 2,
                  }}>{it.d}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text,
                  }}>{it.n}</div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {it.t} · {it.a ? <><Icon name="check" size={11} color={HOF.success}/> Attended</> : 'Missed'}
                  </div>
                </div>
                <Icon name="chev" size={14} color={HOF.textDis}/>
              </div>
            ))}
          </div>
        </div>

        {/* Settings list */}
        <div style={{ padding: '28px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>Account</div>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            overflow: 'hidden',
          }}>
            {[
              ['Notifications',  'On · Push & email', 'notifs'],
              ['Payment methods', 'Visa ···· 4242',    'payment'],
              ['Privacy & data',  null,                'privacy'],
              ['Help & contact',  null,                'help'],
              ['Log out',         null,                null],
            ].map(([t, sub, view], i, a) => (
              <button key={t} className="hof-btn hof-press"
                      onClick={() => view && onOpenSettings && onOpenSettings(view)}
                      style={{
                        width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px',
                        borderBottom: i < a.length - 1 ? `1px solid ${HOF.border}` : 'none',
                      }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 14, color: t === 'Log out' ? HOF.error : HOF.text }}>{t}</div>
                  {sub && <div style={{
                    fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
                  }}>{sub}</div>}
                </div>
                {t !== 'Log out' && <Icon name="chev" size={14} color={HOF.textDis}/>}
              </button>
            ))}
          </div>
        </div>

        </>}

        <HofHomeSpacer/>
      </HofScroll>

      <HofBottomNav active="profile" onChange={nav}/>
    </HofScreen>
  );
}

Object.assign(window, { ScreenProfile });

// ─── Posts tab — your community activity ────────────────────────────────────
function ProfilePosts({ onOpenPost }) {
  // Pretend SB is the author of p4 + p6
  const myPosts = HOF_POSTS.filter(p => p.author.initials === 'SB');
  const totalReact = myPosts.reduce((s, p) => s + totalReactions(p), 0);
  const totalReply = myPosts.reduce((s, p) => s + p.replyCount, 0);

  return (
    <div style={{ padding: '20px 16px 0' }}>
      {/* Activity stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        padding: '14px 16px',
        background: HOF.surface, border: `1px solid ${HOF.border}`,
        borderRadius: 12,
      }}>
        {[
          [String(myPosts.length), 'Posts'],
          [String(totalReact),     '🔥 Received'],
          [String(totalReply),     'Replies'],
        ].map(([n, l]) => (
          <div key={l}>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
              color: HOF.text, letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}>{n}</div>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec, marginTop: 2,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Your posts */}
      <div style={{ marginTop: 20 }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
        }}>Your posts</div>
        {myPosts.length === 0 ? (
          <div style={{
            padding: '24px 18px', textAlign: 'center',
            background: HOF.surface, border: `1px dashed ${HOF.border}`, borderRadius: 12,
            fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
          }}>
            You haven't posted yet. Go say hello in #general.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myPosts.map(p => (
              <FeedPost key={p.id} post={p} compact
                        onOpen={() => onOpenPost && onOpenPost(p.id)}/>
            ))}
          </div>
        )}
      </div>

      {/* Reactions received */}
      <div style={{ marginTop: 24 }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
        }}>Reactions to your posts</div>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: '14px 16px',
        }}>
          {[
            ['🔥', 22, 'fire reactions'],
            ['👀', 14, 'eyes reactions'],
            ['❤️', 6,  'heart reactions'],
          ].map(([emoji, n, l]) => (
            <div key={l} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
              borderBottom: l !== 'heart reactions' ? `1px solid ${HOF.border}` : 'none',
            }}>
              <span style={{ fontSize: 18 }}>{emoji}</span>
              <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, color: HOF.text }}>
                {l}
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.text,
                fontVariantNumeric: 'tabular-nums', fontWeight: 500,
              }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
