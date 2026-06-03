'use client';

import { colors } from '@hof/design-tokens';
import { Icon } from '@hof/ui';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Minimal artist profile stub — data wired in Phase 3
type Artist = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  soundcloud: string | null;
  genres: string[];
};

export default function ArtistPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params['slug'] === 'string' ? params['slug'] : '';
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/artists/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { artist?: Artist } | null) => {
        setArtist(d?.artist ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        background: '#0A0A08',
        overflowY: 'auto',
        paddingBottom: 48,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 16px 12px',
          background: 'rgba(10,10,8,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="chev" size={18} color={colors.text} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 16,
            color: colors.text,
          }}
        >
          Artist
        </span>
        <div style={{ width: 38 }} />
      </div>

      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              border: `2px solid ${colors.border}`,
              borderTopColor: colors.amber,
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.textSec,
            }}
          >
            Loading artist…
          </div>
        </div>
      )}

      {!loading && artist === null && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
            gap: 12,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Icon name="users" size={28} color={colors.textSec} />
          </div>
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 600,
              fontSize: 22,
              color: colors.text,
              letterSpacing: '-0.01em',
            }}
          >
            Artist profile coming soon
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.textSec,
              lineHeight: 1.6,
              maxWidth: 280,
            }}
          >
            Full artist pages are launching in Phase 3. Check back after the next edition.
          </div>
        </div>
      )}

      {!loading && artist !== null && (
        <div>
          {/* Photo or placeholder */}
          {artist.photo_url ? (
            <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
              <img
                src={artist.photo_url}
                alt={artist.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 200,
                  background:
                    'linear-gradient(180deg, transparent, rgba(10,10,8,0.9) 70%, #0A0A08)',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                height: 200,
                background: `linear-gradient(135deg, ${colors.ember}22, ${colors.amber}22)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  background: colors.surface,
                  border: `2px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 700,
                    fontSize: 32,
                    color: colors.amber,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {artist.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Name + genres */}
          <div style={{ padding: '24px 16px 0' }}>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 700,
                fontSize: 36,
                color: colors.text,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: 12,
              }}
            >
              {artist.name}
            </div>

            {artist.genres.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {artist.genres.map((g) => (
                  <span
                    key={g}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(232,101,26,0.12)',
                      border: `1px solid ${colors.amber}30`,
                      fontFamily: 'Inter',
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.amber,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {artist.bio && (
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: colors.textSec,
                  lineHeight: 1.65,
                  marginBottom: 24,
                }}
              >
                {artist.bio}
              </div>
            )}

            {/* Social links */}
            {(artist.instagram ?? artist.soundcloud) && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 16,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                {artist.instagram && (
                  <a
                    href={`https://instagram.com/${artist.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 14px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      fontFamily: 'Inter',
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.text,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="share" size={14} color={colors.textSec} />
                    Instagram
                  </a>
                )}
                {artist.soundcloud && (
                  <a
                    href={artist.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 14px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      fontFamily: 'Inter',
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.text,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="music" size={14} color={colors.textSec} />
                    SoundCloud
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
