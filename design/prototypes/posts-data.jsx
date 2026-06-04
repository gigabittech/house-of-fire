// posts-data.jsx — Shared post model + FeedPost card (reused across Home,
// Community, Profile, and Event mini-feed).

const CHANNELS = [
  { id: 'general', name: 'general',  desc: 'Announcements & house notes',  pinned: true },
  { id: 'lineup',  name: 'lineup',   desc: 'Artists, set times, music talk' },
  { id: 'recap',   name: 'recap',    desc: 'After-the-night photos & stories' },
  { id: 'help',    name: 'help',     desc: 'Lost-and-found, first-timer Qs' },
  { id: 'crew',    name: 'crew',     desc: 'Crew-only',  locked: true },
];

const HOF_POSTS = [
  {
    id: 'p1', channel: 'general', kind: 'announcement',
    author: { name: 'Jordan',  initials: 'JG', role: 'crew' },
    time: '2h', edition: 24,
    title: 'Theme 24 lineup is final',
    body: 'Headliner reveal: HEX takes the 12:00 slot. Doors at 8 sharp — we open the floor at 9. Full set times in the event page.',
    reactions: { fire: 52, heart: 12, pray: 4 }, myReaction: null,
    replyCount: 7, pinned: true,
  },
  {
    id: 'p2', channel: 'recap', kind: 'recap',
    author: { name: 'Crew', initials: 'CR', role: 'crew' },
    time: '3d', edition: 23,
    title: 'Theme 23 recap is up',
    body: '127 photos from the night by Mauro. Tag yourself — visible to members only.',
    photoSeeds: [0, 1, 2, 3],
    reactions: { fire: 184, heart: 41, music: 19 }, myReaction: 'fire',
    replyCount: 21,
  },
  {
    id: 'p3', channel: 'general', kind: 'quick',
    author: { name: 'Jordan',  initials: 'JG', role: 'crew' },
    time: '6d',
    body: "Heads up — coat check this month is $3 cash. We'll have a Venmo backup. See you Friday.",
    reactions: { fire: 12 }, replyCount: 3,
  },
  {
    id: 'p4', channel: 'lineup', kind: 'quick',
    author: { name: 'nightowl', initials: 'SB', role: 'member' },
    time: '8h', edition: 24,
    body: 'Anyone know if HEX is playing any tracks from the new EP? Heard the unreleased one at Movement.',
    reactions: { fire: 8, eyes: 14 }, replyCount: 11,
  },
  {
    id: 'p5', channel: 'lineup', kind: 'announcement',
    author: { name: 'M3DIUM', initials: 'M3', role: 'member', verified: true },
    time: '1d', edition: 24,
    title: 'Set time confirmed — 10:30 → 12:00',
    body: 'Bringing the new edit of the Nubya track. Hope you all like it loud.',
    reactions: { fire: 67, music: 22, heart: 9 }, replyCount: 5,
  },
  {
    id: 'p6', channel: 'help', kind: 'quick',
    author: { name: 'iris.w', initials: 'IW', role: 'member' },
    time: '4h',
    body: 'First-timer question — how strict is no-phones-on-the-floor? Can I check in once during the night to message my ride?',
    reactions: { fire: 3 }, replyCount: 8,
  },
  {
    id: 'p7', channel: 'recap', kind: 'quick',
    author: { name: 'devon', initials: 'DP', role: 'member' },
    time: '2d', edition: 23,
    body: 'Photo #047 is me at peak euphoria. Mauro you are a genius.',
    reactions: { fire: 24, heart: 8 }, replyCount: 2,
  },
];

const HOF_REPLIES = {
  p1: [
    { author: { name: 'nightowl', initials: 'SB', role: 'member' }, time: '1h',
      body: "Let's gooo. Glad you held the slot for HEX." },
    { author: { name: 'devon', initials: 'DP', role: 'member' }, time: '52m',
      body: 'Set times posted on the event page? Trying to plan my arrival.' },
    { author: { name: 'Jordan', initials: 'JG', role: 'crew' }, time: '45m',
      body: 'Yep — go check it. IGNYTE opens at 9 sharp.', replyTo: 'devon' },
    { author: { name: 'iris.w', initials: 'IW', role: 'member' }, time: '32m',
      body: 'HEX!!! my year is made.' },
  ],
  p2: [
    { author: { name: 'tara', initials: 'TR', role: 'member' }, time: '2d',
      body: 'Photo #047 has me crying. The light, the moment, everything.' },
    { author: { name: 'devon', initials: 'DP', role: 'member' }, time: '2d',
      body: "Tagged myself in #082. Best night I've had this year." },
  ],
};

// ─── Reaction set ───────────────────────────────────────────────────────────
const REACTION_EMOJI = { fire: '🔥', heart: '❤️', pray: '🙏', music: '🎶', eyes: '👀' };

function totalReactions(post) {
  return Object.values(post.reactions || {}).reduce((s, v) => s + v, 0);
}

// ─── Feed Post card — the main reusable atom ────────────────────────────────
function FeedPost({ post, onOpen, compact = false, showChannel = false }) {
  const isRecap = post.kind === 'recap';
  const isQuick = post.kind === 'quick';
  const total = totalReactions(post);

  return (
    <button className="hof-btn hof-press" onClick={onOpen}
            style={{
              width: '100%', textAlign: 'left', padding: 0,
              background: HOF.surface, border: `1px solid ${HOF.border}`,
              borderRadius: 12, overflow: 'hidden', display: 'block',
            }}>
      {/* Author row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: compact ? '10px 12px 6px' : '12px 14px 8px',
      }}>
        <Avatar initials={post.author.initials} role={post.author.role} size={compact ? 28 : 32}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text,
            }}>{post.author.name}</span>
            {post.author.role === 'crew' && (
              <HofPill tone="crew" size="sm">Crew</HofPill>
            )}
            {post.author.verified && (
              <HofPill tone="amber" size="sm">Artist</HofPill>
            )}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 1,
          }}>
            {post.time} ago
            <span style={{ color: HOF.textDis }}>·</span>
            <ChannelTag id={post.channel}/>
            {showChannel && post.edition && <>
              <span style={{ color: HOF.textDis }}>·</span>
              <span>Th {post.edition}</span>
            </>}
          </div>
        </div>
        {post.pinned && (
          <div style={{
            width: 22, height: 22, borderRadius: 4,
            background: 'rgba(232,101,26,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="Pinned">
            <Icon name="pin" size={12} color={HOF.amber}/>
          </div>
        )}
      </div>

      {/* Body */}
      {post.title && (
        <div style={{
          padding: compact ? '0 12px 4px' : '0 14px 6px',
          fontFamily: 'Clash Display', fontWeight: 600,
          fontSize: compact ? 16 : 18,
          color: HOF.text, letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>{post.title}</div>
      )}
      {post.body && (
        <div style={{
          padding: compact ? '0 12px 10px' : (isQuick ? '0 14px 12px' : '0 14px 10px'),
          fontFamily: 'Inter', fontSize: compact ? 12 : 13,
          color: HOF.textSec, lineHeight: 1.5, textWrap: 'pretty',
        }}>{post.body}</div>
      )}

      {/* Recap collage */}
      {isRecap && post.photoSeeds && !compact && (
        <div style={{
          margin: '4px 14px 12px',
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr',
          gap: 3, height: 156, borderRadius: 8, overflow: 'hidden',
        }}>
          <HofPhoto seed={post.photoSeeds[0]} gradient={false} style={{ gridRow: '1 / 3', height: '100%' }}/>
          <HofPhoto seed={post.photoSeeds[1]} gradient={false}/>
          <HofPhoto seed={post.photoSeeds[2]} gradient={false}/>
          <HofPhoto seed={post.photoSeeds[3]} gradient={false} style={{ gridColumn: '2 / 4' }}/>
        </div>
      )}

      {/* Reactions row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: compact ? '6px 12px 10px' : '8px 14px 12px',
        borderTop: `1px solid ${HOF.border}`,
      }}>
        <ReactionStrip post={post} compact={compact}/>
        <div style={{ flex: 1 }}/>
        <span style={{
          fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec,
          letterSpacing: '0.04em',
        }}>{post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}</span>
      </div>
    </button>
  );
}

// Avatar with role-tinted ring
function Avatar({ initials, role, size = 32 }) {
  const isCrew = role === 'crew';
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      background: isCrew
        ? `linear-gradient(135deg, ${HOF.amber}, ${HOF.ember})`
        : HOF.elevated,
      border: isCrew ? 'none' : `1px solid ${HOF.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter', fontSize: size * 0.36, fontWeight: 600,
      color: isCrew ? HOF.bg : HOF.text,
      letterSpacing: '-0.01em',
    }}>{initials}</div>
  );
}

function ChannelTag({ id, style = {} }) {
  return (
    <span style={{
      fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.amber,
      letterSpacing: '0.02em', ...style,
    }}>#{id}</span>
  );
}

// Stacked reaction emojis with total
function ReactionStrip({ post, compact = false }) {
  const keys = Object.keys(post.reactions || {});
  if (keys.length === 0) {
    return (
      <span style={{
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
      }}>Be the first to react</span>
    );
  }
  const total = totalReactions(post);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 16,
      background: post.myReaction ? 'rgba(232,101,26,0.12)' : HOF.elevated,
      border: `1px solid ${post.myReaction ? 'rgba(232,101,26,0.35)' : HOF.border}`,
    }}>
      <span style={{
        display: 'inline-flex', gap: -4,
      }}>
        {keys.slice(0, 3).map((k, i) => (
          <span key={k} style={{
            fontSize: compact ? 11 : 12, lineHeight: 1,
            marginLeft: i ? -4 : 0,
          }}>{REACTION_EMOJI[k]}</span>
        ))}
      </span>
      <span style={{
        fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.text,
        fontVariantNumeric: 'tabular-nums', fontWeight: 500,
      }}>{total}</span>
    </span>
  );
}

Object.assign(window, {
  CHANNELS, HOF_POSTS, HOF_REPLIES, REACTION_EMOJI,
  FeedPost, Avatar, ChannelTag, ReactionStrip, totalReactions,
});
