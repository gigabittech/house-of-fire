// screen-post.jsx — Single post detail with threaded replies + sticky composer

function ScreenPost({ postId = 'p1', onBack, onOpenAuthor }) {
  const post = HOF_POSTS.find(p => p.id === postId) || HOF_POSTS[0];
  const replies = HOF_REPLIES[post.id] || [];
  const [myReact, setMyReact] = React.useState(post.myReaction);
  const [reply, setReply]     = React.useState('');
  const [reactPickerOpen, setReactPickerOpen] = React.useState(false);

  const reactionKeys = Object.keys(REACTION_EMOJI);
  const isRecap = post.kind === 'recap';

  return (
    <HofScreen>
      <HofTopBar title="Thread" onBack={onBack}
                 right={<Icon name="share" size={18} color={HOF.text}/>}/>

      <HofScroll>
        <div style={{ height: 102 }}/>

        {/* Original post — hero */}
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`,
            borderRadius: 14, padding: 18, position: 'relative',
            overflow: 'hidden',
          }}>
            {post.pinned && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 8px', borderRadius: 4,
                background: 'rgba(232,101,26,0.12)',
                border: `1px solid rgba(232,101,26,0.3)`,
                fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
                letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
              }}>
                <Icon name="pin" size={10} color={HOF.amber}/> Pinned
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={post.author.initials} role={post.author.role} size={42}/>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text,
                  }}>{post.author.name}</span>
                  {post.author.role === 'crew' && <HofPill tone="crew" size="sm">Crew</HofPill>}
                  {post.author.verified && <HofPill tone="amber" size="sm">Artist</HofPill>}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2,
                }}>
                  {post.time} ago <span style={{ color: HOF.textDis }}>·</span>
                  <ChannelTag id={post.channel}/>
                </div>
              </div>
            </div>

            {post.title && (
              <div style={{
                marginTop: 14,
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
                color: HOF.text, letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>{post.title}</div>
            )}
            {post.body && (
              <div style={{
                marginTop: 10,
                fontFamily: 'Inter', fontSize: 15, color: HOF.text,
                lineHeight: 1.55, textWrap: 'pretty',
              }}>{post.body}</div>
            )}

            {isRecap && post.photoSeeds && (
              <div style={{
                marginTop: 14,
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr',
                gap: 3, height: 180, borderRadius: 8, overflow: 'hidden',
              }}>
                <HofPhoto seed={post.photoSeeds[0]} gradient={false} style={{ gridRow: '1 / 3', height: '100%' }}/>
                <HofPhoto seed={post.photoSeeds[1]} gradient={false}/>
                <HofPhoto seed={post.photoSeeds[2]} gradient={false}/>
                <HofPhoto seed={post.photoSeeds[3]} gradient={false} style={{ gridColumn: '2 / 4' }}/>
              </div>
            )}

            {/* Reaction row */}
            <div style={{
              marginTop: 16, paddingTop: 14, borderTop: `1px solid ${HOF.border}`,
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            }}>
              {reactionKeys.map(k => {
                const count = (post.reactions && post.reactions[k]) || 0;
                const mine = myReact === k;
                const adjusted = count + (mine ? 1 : 0) - (post.myReaction === k ? 1 : 0);
                if (adjusted === 0 && !mine) return null;
                return (
                  <button key={k} className="hof-btn hof-press"
                          onClick={() => setMyReact(mine ? null : k)}
                          style={{
                            padding: '6px 10px', borderRadius: 16,
                            background: mine ? 'rgba(232,101,26,0.18)' : HOF.elevated,
                            border: mine ? `1px solid rgba(232,101,26,0.4)` : `1px solid ${HOF.border}`,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                          }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{REACTION_EMOJI[k]}</span>
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.text,
                      fontVariantNumeric: 'tabular-nums', fontWeight: 500,
                    }}>{adjusted}</span>
                  </button>
                );
              })}
              <button className="hof-btn hof-press" onClick={() => setReactPickerOpen(v => !v)}
                      style={{
                        padding: '6px 10px', borderRadius: 16,
                        background: HOF.elevated, border: `1px solid ${HOF.border}`,
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                      }}>
                <Icon name="plus" size={12} color={HOF.textSec}/>
              </button>
            </div>

            {reactPickerOpen && (
              <div style={{
                marginTop: 10, padding: '10px 12px',
                background: HOF.bg, border: `1px solid ${HOF.border}`,
                borderRadius: 10,
                display: 'flex', justifyContent: 'space-around',
              }}>
                {reactionKeys.map(k => (
                  <button key={k} className="hof-btn hof-press"
                          onClick={() => { setMyReact(k); setReactPickerOpen(false); }}
                          style={{
                            width: 40, height: 40, borderRadius: 20,
                            background: myReact === k ? HOF.amber : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, lineHeight: 1,
                          }}>
                    {REACTION_EMOJI[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Replies header */}
        <div style={{
          padding: '24px 16px 10px',
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>{replies.length || post.replyCount} replies</div>
          <span style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.amber, fontWeight: 500 }}>
            Sort · oldest first
          </span>
        </div>

        {/* Replies thread */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {replies.length === 0 && (
            <div style={{
              padding: '24px 18px', textAlign: 'center',
              background: HOF.surface, border: `1px dashed ${HOF.border}`, borderRadius: 12,
              fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
            }}>
              Be the first to reply. Quote a moment, ask a question, say something.
            </div>
          )}
          {replies.map((r, i) => <Reply key={i} reply={r}/>)}
        </div>

        <div style={{ height: 140 }}/>
      </HofScroll>

      {/* Sticky composer */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
        background: 'rgba(20,20,18,0.96)', backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${HOF.border}`,
        padding: '12px 14px 34px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials="SB" role="member" size={32}/>
          <div style={{
            flex: 1, background: HOF.surface, border: `1px solid ${HOF.border}`,
            borderRadius: 22, display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 4px 4px 14px',
          }}>
            <input value={reply} onChange={e => setReply(e.target.value)}
                   placeholder={`Reply to ${post.author.name}…`}
                   style={{
                     flex: 1, height: 36, border: 0, background: 'transparent',
                     outline: 'none', fontFamily: 'Inter', fontSize: 14, color: HOF.text,
                   }}/>
            <button className="hof-btn hof-press" aria-label="Attach photo"
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
              <Icon name="image" size={18} color={HOF.textSec}/>
            </button>
            <button className="hof-btn hof-press" aria-label="Send"
                    disabled={!reply.trim()}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: reply.trim() ? HOF.amber : HOF.elevated,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
              <Icon name="arrowR" size={16} color={reply.trim() ? HOF.bg : HOF.textDis}/>
            </button>
          </div>
        </div>
      </div>
    </HofScreen>
  );
}

function Reply({ reply }) {
  const isCrew = reply.author.role === 'crew';
  return (
    <div style={{
      display: 'flex', gap: 10,
    }}>
      <Avatar initials={reply.author.initials} role={reply.author.role} size={32}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`,
          borderRadius: 12, padding: '10px 14px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>
              {reply.author.name}
            </span>
            {isCrew && <HofPill tone="crew" size="sm">Crew</HofPill>}
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>· {reply.time} ago</span>
          </div>
          {reply.replyTo && (
            <div style={{
              borderLeft: `2px solid ${HOF.amber}`,
              padding: '2px 0 2px 8px', marginBottom: 6,
              fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
            }}>
              Replying to <span style={{ color: HOF.text }}>{reply.replyTo}</span>
            </div>
          )}
          <div style={{
            fontFamily: 'Inter', fontSize: 14, color: HOF.text,
            lineHeight: 1.5, textWrap: 'pretty',
          }}>{reply.body}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 14, marginTop: 6,
          fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, fontWeight: 500,
        }}>
          <button className="hof-btn" style={{ color: HOF.textSec, fontSize: 11 }}>🔥 React</button>
          <button className="hof-btn" style={{ color: HOF.textSec, fontSize: 11 }}>Reply</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPost });
