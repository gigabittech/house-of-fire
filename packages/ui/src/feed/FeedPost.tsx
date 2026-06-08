'use client';

import { colors, fontFamilies } from '@hof/design-tokens';
import { useState, type CSSProperties } from 'react';
import { HofPill } from '../HofPill';
import { HofPhoto } from '../HofPhoto';
import { Icon } from '../Icon';
import { ImageLightbox } from '../ImageLightbox';
import { PhotoPlaceholder } from '../PhotoPlaceholder';
import { Avatar } from './Avatar';
import { ChannelTag } from './ChannelTag';
import { ReactionPicker } from './ReactionPicker';
import { ReactionStrip } from './ReactionStrip';
import type { Post, ReactionKey } from './types';

export interface FeedPostProps {
  post: Post;
  onOpen?: () => void;
  compact?: boolean;
  showChannel?: boolean;
  resolvePhoto?: (seed: number) => string;
  interactiveReactions?: boolean;
  onReact?: (emoji: ReactionKey) => void;
}

const MODERATION_LABEL: Record<string, { label: string; tone: 'amber' | 'danger' | 'neutral' }> = {
  pending: { label: 'Pending review', tone: 'amber' },
  rejected: { label: 'Rejected', tone: 'danger' },
  hidden: { label: 'Removed', tone: 'neutral' },
};

export function FeedPost({
  post,
  onOpen,
  compact = false,
  showChannel = false,
  resolvePhoto,
  interactiveReactions = false,
  onReact,
}: FeedPostProps) {
  const isRecap = post.kind === 'recap';
  const isQuick = post.kind === 'quick';
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const recapCell = (seed: number, style?: CSSProperties) =>
    resolvePhoto ? (
      <HofPhoto src={resolvePhoto(seed)} gradient={false} style={style} />
    ) : (
      <PhotoPlaceholder seed={seed} style={style} />
    );

  const seeds = post.photoSeeds ?? [];
  const imageUrls = post.imageUrls ?? [];
  const modBadge =
    post.moderationStatus && post.moderationStatus !== 'approved'
      ? MODERATION_LABEL[post.moderationStatus]
      : null;

  const myReactions = post.myReactions ?? (post.myReaction ? [post.myReaction] : []);

  return (
    <>
      <article
        className="hof-press"
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
        {/* Author row — clickable */}
        <button
          type="button"
          className="hof-btn"
          onClick={onOpen}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: 0,
            background: 'transparent',
            border: 'none',
            display: 'block',
            cursor: onOpen ? 'pointer' : 'default',
          }}
        >
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
              src={post.author.avatarUrl}
              alt={post.author.name}
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
                {modBadge && (
                  <HofPill tone={modBadge.tone} size="sm">
                    {modBadge.label}
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
                    <span>Th {post.edition}</span>
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
        </button>

        {/* Body — clickable */}
        {(post.title || post.body) && (
          <button
            type="button"
            className="hof-btn"
            onClick={onOpen}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: 0,
              background: 'transparent',
              border: 'none',
              display: 'block',
              cursor: onOpen ? 'pointer' : 'default',
            }}
          >
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
          </button>
        )}

        {post.moderationStatus === 'rejected' && post.moderationNote && (
          <div
            style={{
              margin: '0 14px 10px',
              padding: '8px 10px',
              background: 'rgba(232,74,26,0.08)',
              border: '1px solid rgba(232,74,26,0.2)',
              borderRadius: 8,
              fontFamily: fontFamilies.body,
              fontSize: 12,
              color: colors.textSec,
              lineHeight: 1.4,
            }}
          >
            {post.moderationNote}
          </div>
        )}

        {imageUrls.length > 0 && !compact && (
          <div
            style={{
              margin: '4px 14px 12px',
              display: 'grid',
              gridTemplateColumns:
                imageUrls.length === 1 ? '1fr' : imageUrls.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr',
              gap: 4,
              borderRadius: 8,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            {imageUrls.slice(0, 3).map((url, i) => (
              <button
                key={url}
                type="button"
                className="hof-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(i);
                }}
                style={{
                  position: 'relative',
                  padding: 0,
                  border: 'none',
                  background: colors.elevated,
                  cursor: 'zoom-in',
                  overflow: 'hidden',
                  minWidth: 0,
                  width: '100%',
                  aspectRatio: imageUrls.length === 1 ? '16 / 9' : '1',
                  maxHeight: imageUrls.length === 1 ? 200 : 120,
                }}
              >
                <img
                  src={url}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block',
                    background: colors.elevated,
                  }}
                />
                {i === 2 && imageUrls.length > 3 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: fontFamilies.mono,
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    +{imageUrls.length - 3}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: compact ? '6px 12px 10px' : '8px 14px 12px',
            borderTop: `1px solid ${colors.border}`,
            flexWrap: 'wrap',
          }}
        >
          <ReactionStrip
            post={post}
            compact={compact}
            interactive={interactiveReactions}
            myReactions={myReactions}
            onOpenPicker={() => setPickerOpen((v) => !v)}
          />
          {pickerOpen && interactiveReactions && onReact && (
            <ReactionPicker
              myReactions={myReactions}
              compact={compact}
              onToggle={(key) => {
                onReact(key);
              }}
            />
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="hof-btn"
            onClick={onOpen}
            style={{
              fontFamily: fontFamilies.mono,
              fontSize: 11,
              color: colors.textSec,
              letterSpacing: '0.04em',
              background: 'transparent',
              border: 'none',
              cursor: onOpen ? 'pointer' : 'default',
              padding: 0,
            }}
          >
            {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        </div>
      </article>

      {lightboxIndex !== null && (
        <ImageLightbox
          urls={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
