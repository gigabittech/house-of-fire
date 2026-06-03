import { colors, fontFamilies } from '@hof/design-tokens';
import type { CSSProperties } from 'react';
import { HofPhoto } from '../HofPhoto';
import { HofPill } from '../HofPill';
import { Icon } from '../Icon';
import { PhotoPlaceholder } from '../PhotoPlaceholder';
import { Avatar } from './Avatar';
import { ChannelTag } from './ChannelTag';
import { ReactionStrip } from './ReactionStrip';
import type { Post } from './types';

export interface FeedPostProps {
  post: Post;
  onOpen?: () => void;
  compact?: boolean;
  showChannel?: boolean;
  /**
   * Resolves a recap photo seed to a real image URL. When omitted, recap
   * collages fall back to PhotoPlaceholder. The app passes a resolver backed
   * by its own photo library.
   */
  resolvePhoto?: (seed: number) => string;
}

// The main reusable feed atom — reused across Home, Community, Profile, Event.
export function FeedPost({
  post,
  onOpen,
  compact = false,
  showChannel = false,
  resolvePhoto,
}: FeedPostProps) {
  const isRecap = post.kind === 'recap';
  const isQuick = post.kind === 'quick';

  const recapCell = (seed: number, style?: CSSProperties) =>
    resolvePhoto ? (
      <HofPhoto src={resolvePhoto(seed)} gradient={false} style={style} />
    ) : (
      <PhotoPlaceholder seed={seed} style={style} />
    );

  const seeds = post.photoSeeds ?? [];

  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onOpen}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 0,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'block',
      }}
    >
      {/* Author row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: compact ? '10px 12px 6px' : '12px 14px 8px',
        }}
      >
        <Avatar
          initials={post.author.initials}
          userRole={post.author.role}
          size={compact ? 28 : 32}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: fontFamilies.body,
                fontWeight: 500,
                fontSize: 13,
                color: colors.text,
              }}
            >
              {post.author.name}
            </span>
            {post.author.role === 'crew' && (
              <HofPill tone="crew" size="sm">
                Crew
              </HofPill>
            )}
            {post.author.verified && (
              <HofPill tone="amber" size="sm">
                Artist
              </HofPill>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: fontFamilies.body,
              fontSize: 11,
              color: colors.textSec,
              marginTop: 1,
            }}
          >
            {post.time} ago
            <span style={{ color: colors.textDis }}>·</span>
            <ChannelTag id={post.channel} />
            {showChannel && post.edition && (
              <>
                <span style={{ color: colors.textDis }}>·</span>
                <span>Ed {post.edition}</span>
              </>
            )}
          </div>
        </div>
        {post.pinned && (
          <div
            title="Pinned"
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'rgba(232,101,26,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="pin" size={12} color={colors.amber} />
          </div>
        )}
      </div>

      {/* Body */}
      {post.title && (
        <div
          style={{
            padding: compact ? '0 12px 4px' : '0 14px 6px',
            fontFamily: fontFamilies.display,
            fontWeight: 600,
            fontSize: compact ? 16 : 18,
            color: colors.text,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {post.title}
        </div>
      )}
      {post.body && (
        <div
          style={{
            padding: compact ? '0 12px 10px' : isQuick ? '0 14px 12px' : '0 14px 10px',
            fontFamily: fontFamilies.body,
            fontSize: compact ? 12 : 13,
            color: colors.textSec,
            lineHeight: 1.5,
          }}
        >
          {post.body}
        </div>
      )}

      {post.imageUrls && post.imageUrls.length > 0 && !compact && (
        <div
          style={{
            margin: '4px 14px 12px',
            display: 'grid',
            gridTemplateColumns:
              post.imageUrls.length === 1 ? '1fr' : post.imageUrls.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: 4,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {post.imageUrls.slice(0, 3).map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
                display: 'block',
                background: colors.elevated,
              }}
            />
          ))}
        </div>
      )}

      {/* Recap collage */}
      {isRecap && post.photoSeeds && !compact && (
        <div
          style={{
            margin: '4px 14px 12px',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 3,
            height: 156,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {recapCell(seeds[0] ?? 0, { gridRow: '1 / 3', height: '100%' })}
          {recapCell(seeds[1] ?? 0)}
          {recapCell(seeds[2] ?? 0)}
          {recapCell(seeds[3] ?? 0, { gridColumn: '2 / 4' })}
        </div>
      )}

      {/* Reactions row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: compact ? '6px 12px 10px' : '8px 14px 12px',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <ReactionStrip post={post} compact={compact} />
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: fontFamilies.mono,
            fontSize: 11,
            color: colors.textSec,
            letterSpacing: '0.04em',
          }}
        >
          {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    </button>
  );
}
