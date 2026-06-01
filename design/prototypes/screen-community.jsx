// screen-community.jsx — Community tab (channels + pinned + feed)

function ScreenCommunity({ nav, onOpenPost, startComposerOpen = false, startChannel = 'general' }) {
  const [channel, setChannel] = React.useState(startChannel);
  const [sort, setSort]       = React.useState('latest');
  const [composerOpen, setComposerOpen] = React.useState(startComposerOpen);
  const [notifsOpen, setNotifsOpen]     = React.useState(false);

  // Filter posts by channel, with pinned first
  const filtered = HOF_POSTS
    .filter(p => channel === 'all' || p.channel === channel)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const activeChannel = CHANNELS.find(c => c.id === channel);

  return (
    <HofScreen>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, zIndex: 10,
        padding: '8px 16px 0',
        background: 'rgba(10,10,8,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${HOF.border}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 0 10px',
        }}>
          <div>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>The Board</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
              color: HOF.text, letterSpacing: '-0.01em', marginTop: 2,
            }}>Community</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="hof-btn hof-press" onClick={() => setNotifsOpen(true)}
                    aria-label="Notifications"
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: HOF.surface, border: `1px solid ${HOF.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
              <Icon name="bell" size={16} color={HOF.text}/>
              <span style={{
                position: 'absolute', top: -2, right: -2,
                width: 10, height: 10, borderRadius: 5,
                background: HOF.amber, border: `2px solid ${HOF.bg}`,
              }}/>
            </button>
            <button className="hof-btn hof-press" aria-label="Search"
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: HOF.surface, border: `1px solid ${HOF.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
              <Icon name="search" size={16} color={HOF.text}/>
            </button>
          </div>
        </div>

        {/* Channel pills */}
        <div className="hof-scroll" style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          paddingBottom: 10, margin: '0 -16px', paddingLeft: 16, paddingRight: 16,
        }}>
          {CHANNELS.map(c => {
            const active = channel === c.id;
            const locked = c.locked;
            return (
              <button key={c.id} className="hof-btn hof-press"
                      onClick={() => !locked && setChannel(c.id)}
                      style={{
                        flexShrink: 0,
                        padding: '7px 12px',
                        background: active ? HOF.amber : (locked ? HOF.surface : HOF.elevated),
                        border: active ? `1px solid ${HOF.amber}`
                              : `1px solid ${HOF.border}`,
                        borderRadius: 6,
                        display: 'flex', alignItems: 'center', gap: 5,
                        opacity: locked ? 0.55 : 1,
                      }}>
                <span style={{
                  fontFamily: 'JetBrains Mono', fontSize: 12,
                  color: active ? HOF.bg : (locked ? HOF.textSec : HOF.text),
                  fontWeight: 500, letterSpacing: '0.02em',
                }}>#{c.name}</span>
                {locked && <Icon name="diamond" size={10} color={HOF.textSec}/>}
              </button>
            );
          })}
        </div>
      </div>

      <HofScroll>
        <div style={{ height: 162 /* topbar + pills */ }}/>

        {/* Channel description */}
        <div style={{
          padding: '14px 16px 6px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
              color: HOF.text, letterSpacing: '-0.01em',
            }}>#{activeChannel?.name}</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>
              {activeChannel?.desc}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['latest', 'Latest'], ['top', 'Top this month']].map(([k, l]) => (
              <button key={k} className="hof-btn" onClick={() => setSort(k)}
                      style={{
                        padding: '6px 10px', borderRadius: 6,
                        background: sort === k ? HOF.elevated : 'transparent',
                        border: sort === k ? `1px solid ${HOF.border}` : `1px solid transparent`,
                        fontFamily: 'Inter', fontSize: 11, color: sort === k ? HOF.text : HOF.textSec,
                        fontWeight: 500,
                      }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Pinned strip */}
        {filtered.filter(p => p.pinned).length > 0 && (
          <div style={{ padding: '8px 16px 4px' }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8,
            }}>📌 Pinned by Crew</div>
          </div>
        )}

        {/* Feed */}
        <div style={{
          padding: '0 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {filtered.length === 0 ? (
            <EmptyChannel channel={activeChannel} onCompose={() => setComposerOpen(true)}/>
          ) : (
            filtered.map(p => (
              <FeedPost key={p.id} post={p} showChannel={channel === 'all'}
                        onOpen={() => onOpenPost && onOpenPost(p.id)}/>
            ))
          )}
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      {/* Floating compose */}
      <button className="hof-btn hof-press" onClick={() => setComposerOpen(true)}
              aria-label="New post"
              style={{
                position: 'absolute', right: 18, bottom: 110, zIndex: 25,
                width: 56, height: 56, borderRadius: 28,
                background: HOF.amber,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(232,101,26,0.35), 0 2px 4px rgba(0,0,0,0.4)',
              }}>
        <Icon name="plus" size={26} color={HOF.bg}/>
      </button>

      <HofBottomNav active="community" onChange={nav}/>

      <ComposerSheet open={composerOpen} onClose={() => setComposerOpen(false)} defaultChannel={channel}/>
      <NotificationsScreen open={notifsOpen} onClose={() => setNotifsOpen(false)}
                           onOpenPost={(id) => { setNotifsOpen(false); onOpenPost && onOpenPost(id); }}/>
    </HofScreen>
  );
}

function EmptyChannel({ channel, onCompose }) {
  return (
    <div style={{
      padding: '32px 20px', textAlign: 'center',
      background: HOF.surface, border: `1px solid ${HOF.border}`,
      borderRadius: 14, marginTop: 8,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28, margin: '0 auto 12px',
        background: 'rgba(232,101,26,0.10)',
        border: `1px solid rgba(232,101,26,0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="chat" size={24} color={HOF.amber}/>
      </div>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
        color: HOF.text, letterSpacing: '-0.01em',
      }}>Quiet in here.</div>
      <div style={{
        fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
        marginTop: 6, lineHeight: 1.5, maxWidth: 240, marginLeft: 'auto', marginRight: 'auto',
      }}>
        Be the first to post in #{channel?.name}. {channel?.desc}.
      </div>
      <div style={{ marginTop: 14 }}>
        <HofButton variant="primary" size="md" onClick={onCompose}
                   icon={<Icon name="plus" size={14} color={HOF.bg}/>}>
          Start a post
        </HofButton>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenCommunity });
