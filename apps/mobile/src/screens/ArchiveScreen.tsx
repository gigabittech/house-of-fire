'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@hof/design-tokens';
import { Icon, HofAppShell, useResponsive, FeedSkeletonCard, EmptyState } from '@hof/ui';
import type { NavId } from '@hof/ui';
import { navHref } from '../lib/nav.js';
import { photoSrc } from '../data/photos.js';
import PhotoSubmitSheet from '../sheets/PhotoSubmitSheet.js';

interface ApiEvent {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  venue_name?: string;
}

// Heights alternate for visual rhythm (same as original static layout)
const CARD_HEIGHTS = [240, 200, 240, 200, 240, 200] as const;

const years = ['2026', '2025', '2024'] as const;
type Year = typeof years[number];

export default function ArchiveScreen() {
  const router = useRouter();
  const [year, setYear] = useState<Year>(String(new Date().getFullYear()) as Year);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [archives, setArchives] = useState<ApiEvent[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(true);
  const [archiveError, setArchiveError] = useState(false);

  useEffect(() => {
    setLoadingArchive(true);
    setArchiveError(false);
    fetch(`/api/events/archive?year=${year}`)
      .then(r => r.json())
      .then(d => { if (d.events) setArchives(d.events); else setArchives([]); })
      .catch(() => setArchiveError(true))
      .finally(() => setLoadingArchive(false));
  }, [year]);

  const entries = archives;

  const { isWide } = useResponsive();

  return (
    <HofAppShell active="events" onNav={(id: NavId) => router.push(navHref[id])}>
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: colors.bg }}>
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 912px)' : 'auto',
          overflowY: 'auto',
        }}
      >
        <div style={{ height: 54 }}/>

        {/* Title */}
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: colors.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>The Archive</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 700, fontSize: 44,
            color: colors.text, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 6,
            textTransform: 'uppercase',
          }}>Every<br/>edition.</div>
          <div style={{
            fontFamily: 'Inter', fontSize: 14, color: colors.textSec, marginTop: 12,
            lineHeight: 1.5, maxWidth: 280,
          }}>
            Every event. Every month. Since April 2024.
          </div>
        </div>

        {/* Year filter */}
        <div style={{
          padding: '20px 16px 16px',
          display: 'flex', gap: 6, overflowX: 'auto',
        }}>
          {years.map(y => (
            <button
              key={y}
              className="hof-btn hof-press"
              onClick={() => setYear(y)}
              style={{
                padding: '8px 16px',
                background: year === y ? colors.amber : colors.surface,
                border: `1px solid ${year === y ? colors.amber : colors.border}`,
                color: year === y ? colors.bg : colors.text,
                borderRadius: 999, fontFamily: 'Inter', fontWeight: 500, fontSize: 13,
                flexShrink: 0,
              }}
            >{y}</button>
          ))}
        </div>

        {/* Grid */}
        {loadingArchive ? (
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map((i) => <FeedSkeletonCard key={i} />)}
          </div>
        ) : archiveError ? (
          <div style={{ padding: '0 16px' }}>
            <EmptyState title="Could not load events" body="Check your connection and try again." />
          </div>
        ) : (
        <div style={{
          padding: '0 12px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {entries.map((e, i) => {
            const cardH = CARD_HEIGHTS[i % CARD_HEIGHTS.length] ?? 220;
            const formattedDate = new Date(e.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            });
            return (
              <button
                key={e.id}
                className="hof-btn hof-press"
                style={{
                  textAlign: 'left', padding: 0,
                  background: 'transparent', borderRadius: 10, overflow: 'hidden',
                }}
              >
                {/* Photo card */}
                <div style={{ position: 'relative', width: '100%', height: cardH, borderRadius: 10, overflow: 'hidden' }}>
                  <img
                    src={photoSrc(i)}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Gradient + meta */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(180deg, transparent, rgba(10,10,8,0.95))',
                    padding: '40px 12px 12px',
                  }}>
                    <div style={{
                      fontFamily: 'Inter', fontSize: 9, color: colors.amber,
                      letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 2,
                    }}>{formattedDate} · {year}</div>
                    <div style={{
                      fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                      color: colors.text, letterSpacing: '-0.01em', lineHeight: 1.05,
                    }}>{e.name}</div>
                  </div>
                  {/* Edition badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    fontFamily: 'JetBrains Mono', fontSize: 10, color: colors.text,
                    background: 'rgba(10,10,8,0.6)', padding: '3px 7px', borderRadius: 4,
                    backdropFilter: 'blur(4px)',
                  }}>N&ordm;{String(e.edition_number).padStart(2, '0')}</div>
                </div>
              </button>
            );
          })}

          {entries.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState title="No past events yet." />
            </div>
          )}
        </div>
        )}

        {/* Bottom spacer for nav + FAB */}
        <div style={{ height: 140 }}/>
      </div>

      {/* Photo submission FAB */}
      <button
        className="hof-btn hof-press"
        onClick={() => setUploadOpen(true)}
        aria-label="Submit your photos"
        style={{
          position: 'absolute',
          right: isWide ? 'calc(50% - 456px + 18px)' : 18,
          bottom: isWide ? 24 : 110,
          zIndex: 25,
          height: 48, padding: '0 18px 0 14px', borderRadius: 24,
          background: colors.amber,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 24px rgba(232,101,26,0.35), 0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        <Icon name="camera" size={18} color={colors.bg}/>
        <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500, color: colors.bg }}>
          Submit photos
        </span>
      </button>

      <PhotoSubmitSheet open={uploadOpen} onClose={() => setUploadOpen(false)} edition={23}/>
    </div>
    </HofAppShell>
  );
}
