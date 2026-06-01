// community-sheets.jsx — Composer bottom sheet + Notifications screen

// ─── Bottom-sheet helper (shared animation pattern) ─────────────────────────
function useSheetMount(open) {
  const [mounted, setMounted] = React.useState(open);
  const [shown, setShown]     = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);
  return { mounted, shown };
}

// ─── Composer ──────────────────────────────────────────────────────────────
function ComposerSheet({ open, onClose, defaultChannel = 'general' }) {
  const { mounted, shown } = useSheetMount(open);
  const [channel, setChannel] = React.useState(defaultChannel);
  const [title, setTitle]     = React.useState('');
  const [body, setBody]       = React.useState('');
  const [hasPhotos, setHasPhotos] = React.useState(false);
  const [anon, setAnon]       = React.useState(false);

  React.useEffect(() => { if (open) setChannel(defaultChannel); }, [open, defaultChannel]);

  if (!mounted) return null;
  const canPost = body.trim().length > 0;
  const charLimit = 500;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.55)',
        opacity: shown ? 1 : 0, transition: 'opacity 200ms ease-out',
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90,
        background: HOF.surface, borderTop: `1px solid ${HOF.border}`,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
        boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
        maxHeight: '85%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: HOF.border, margin: '12px auto 6px' }}/>

        {/* Header */}
        <div style={{
          padding: '6px 16px 14px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${HOF.border}`,
        }}>
          <button className="hof-btn" onClick={onClose} style={{
            fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, fontWeight: 500,
          }}>Cancel</button>
          <div style={{
            fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text,
          }}>New post</div>
          <HofButton variant="primary" size="sm" disabled={!canPost}>Post</HofButton>
        </div>

        <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>
          {/* Channel picker */}
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8,
          }}>Posting to</div>
          <div className="hof-scroll" style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, margin: '0 -16px',
            paddingLeft: 16, paddingRight: 16,
          }}>
            {CHANNELS.map(c => {
              const active = channel === c.id;
              if (c.locked) return null;
              return (
                <button key={c.id} className="hof-btn hof-press"
                        onClick={() => setChannel(c.id)}
                        style={{
                          flexShrink: 0,
                          padding: '7px 12px',
                          background: active ? HOF.amber : HOF.elevated,
                          border: `1px solid ${active ? HOF.amber : HOF.border}`,
                          borderRadius: 6,
                          fontFamily: 'JetBrains Mono', fontSize: 12,
                          color: active ? HOF.bg : HOF.text,
                          fontWeight: 500,
                        }}>
                  #{c.name}
                </button>
              );
            })}
          </div>

          {/* Title (optional) */}
          <input value={title} onChange={e => setTitle(e.target.value)}
                 placeholder="Title (optional)"
                 style={{
                   width: '100%', boxSizing: 'border-box', marginTop: 16,
                   height: 44, padding: '0 4px',
                   background: 'transparent', border: 0,
                   borderBottom: `1px solid ${HOF.border}`,
                   fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
                   color: HOF.text, outline: 'none', letterSpacing: '-0.01em',
                 }}/>
          {/* Body */}
          <textarea value={body} onChange={e => setBody(e.target.value.slice(0, charLimit))}
                    placeholder={`Say something to #${channel}…`}
                    rows={6}
                    style={{
                      width: '100%', boxSizing: 'border-box', marginTop: 8,
                      padding: '8px 4px', resize: 'none',
                      background: 'transparent', border: 0,
                      fontFamily: 'Inter', fontSize: 15, color: HOF.text,
                      outline: 'none', lineHeight: 1.5,
                    }}/>

          {/* Photo attach */}
          <div style={{ marginTop: 8 }}>
            {!hasPhotos ? (
              <button className="hof-btn hof-press" onClick={() => setHasPhotos(true)}
                      style={{
                        width: '100%', padding: '12px 14px',
                        background: HOF.bg,
                        border: `1px dashed ${HOF.border}`, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
                      }}>
                <Icon name="image" size={16} color={HOF.textSec}/>
                Attach photos
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, height: 120,
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  <HofPhoto seed={0} gradient={false}/>
                  <HofPhoto seed={1} gradient={false}/>
                  <HofPhoto seed={2} gradient={false}/>
                </div>
                <button className="hof-btn hof-press" onClick={() => setHasPhotos(false)}
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

          {/* Bottom toolbar */}
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button className="hof-btn hof-press" onClick={() => setAnon(!anon)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'Inter', fontSize: 13, color: HOF.text,
                    }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                background: anon ? HOF.amber : 'transparent',
                border: `1.5px solid ${anon ? HOF.amber : HOF.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {anon && <Icon name="check" size={12} color={HOF.bg}/>}
              </div>
              Post anonymously
            </button>
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 11,
              color: body.length > charLimit * 0.85 ? HOF.warning : HOF.textSec,
              fontVariantNumeric: 'tabular-nums',
            }}>{body.length} / {charLimit}</span>
          </div>

          {/* Posting as */}
          <div style={{
            marginTop: 10, padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
          }}>
            <Avatar initials={anon ? '?' : 'SB'} role="member" size={20}/>
            Posting as <span style={{ color: HOF.text, fontWeight: 500 }}>
              {anon ? 'Anonymous member' : 'Sujan Bhuiyan'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Notifications screen (mobile, full-screen overlay) ─────────────────────
function NotificationsScreen({ open, onClose, onOpenPost }) {
  const { mounted, shown } = useSheetMount(open);
  if (!mounted) return null;

  const NOTIFS = [
    { kind: 'reply',  read: false, initials: 'DP', name: 'Devon',
      action: 'replied to your post', target: 'how strict is no-phones-on-the-floor?', time: '8m', postId: 'p6' },
    { kind: 'react',  read: false, initials: 'JG', name: 'Jordan',
      action: 'reacted 🔥 to your post', target: 'how strict is no-phones-on-the-floor?', time: '24m', postId: 'p6' },
    { kind: 'crew',   read: false, initials: 'JG', name: 'Jordan',
      action: 'posted in #general', target: 'Edition 24 lineup is final', time: '2h', postId: 'p1', highlight: true },
    { kind: 'mention',read: true,  initials: 'IW', name: 'iris.w',
      action: 'mentioned you', target: '@nightowl will you be there Friday?', time: '1d' },
    { kind: 'photo',  read: true,  initials: 'CR', name: 'Crew',
      action: 'approved your photo for the recap', target: 'Edition 23 · Photo #082', time: '3d' },
    { kind: 'react',  read: true,  initials: 'TR', name: 'Tara',
      action: 'and 11 others reacted to your reply', target: 'Photo #047 has me crying.', time: '4d' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: HOF.bg,
      transform: shown ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 260ms cubic-bezier(0.22, 0.84, 0.36, 1)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 54 }}/>
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${HOF.border}`,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Inbox</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 2,
          }}>Notifications</div>
        </div>
        <button className="hof-btn hof-press" onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: HOF.surface, border: `1px solid ${HOF.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
          <Icon name="close" size={16} color={HOF.text}/>
        </button>
      </div>

      <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Filter row */}
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 6 }}>
          {['All', 'Replies', 'Reactions', 'Crew'].map((f, i) => (
            <button key={f} className="hof-btn hof-press" style={{
              padding: '6px 12px', borderRadius: 6,
              background: i === 0 ? HOF.elevated : 'transparent',
              border: `1px solid ${i === 0 ? HOF.border : 'transparent'}`,
              fontFamily: 'Inter', fontSize: 12, color: i === 0 ? HOF.text : HOF.textSec,
              fontWeight: 500,
            }}>{f}</button>
          ))}
          <div style={{ flex: 1 }}/>
          <button className="hof-btn" style={{
            fontFamily: 'Inter', fontSize: 12, color: HOF.amber, fontWeight: 500,
          }}>Mark all read</button>
        </div>

        {/* Today */}
        <NotifGroup label="Today">
          {NOTIFS.slice(0, 3).map((n, i) => <NotifRow key={i} n={n} onOpenPost={onOpenPost}/>)}
        </NotifGroup>
        <NotifGroup label="Earlier this week">
          {NOTIFS.slice(3).map((n, i) => <NotifRow key={i} n={n} onOpenPost={onOpenPost}/>)}
        </NotifGroup>

        <div style={{ height: 60 }}/>
      </div>
    </div>
  );
}

function NotifGroup({ label, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        padding: '0 16px 8px',
        fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
        letterSpacing: '0.22em', textTransform: 'uppercase',
      }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function NotifRow({ n, onOpenPost }) {
  const iconMap = { reply: 'chat', react: 'flame', crew: 'bell', mention: 'user', photo: 'image' };
  return (
    <button className="hof-btn hof-press"
            onClick={() => n.postId && onOpenPost && onOpenPost(n.postId)}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', gap: 12, padding: '12px 16px',
              background: n.read ? 'transparent' : 'rgba(232,101,26,0.04)',
              borderBottom: `1px solid ${HOF.border}`,
              alignItems: 'center',
            }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar initials={n.initials} role={n.kind === 'crew' || n.name === 'Jordan' || n.name === 'Crew' ? 'crew' : 'member'} size={36}/>
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 18, height: 18, borderRadius: 9,
          background: n.highlight ? HOF.amber : HOF.surface,
          border: `2px solid ${HOF.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={iconMap[n.kind]} size={10} color={n.highlight ? HOF.bg : HOF.textSec}/>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 500 }}>{n.name}</span> <span style={{ color: HOF.textSec }}>{n.action}</span>
        </div>
        <div style={{
          fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontStyle: n.kind === 'reply' || n.kind === 'mention' ? 'italic' : 'normal',
        }}>"{n.target}"</div>
        <div style={{
          fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textDis,
          marginTop: 3,
        }}>{n.time} ago</div>
      </div>
      {!n.read && (
        <div style={{
          width: 8, height: 8, borderRadius: 4, background: HOF.amber, flexShrink: 0,
        }}/>
      )}
    </button>
  );
}

Object.assign(window, { ComposerSheet, NotificationsScreen });
