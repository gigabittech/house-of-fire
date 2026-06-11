'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import { EmptyState, FeedSkeletonCard, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { archiveThemePath } from '@/lib/resolveEventSlug';
import { useAppPageColumn } from '@/hooks/useAppPageColumn';
import { photoSrc } from '../data/photos';
import PhotoSubmitSheet from '../sheets/PhotoSubmitSheet';

interface ApiEvent {
  id: string;
  edition_number: number;
  name: string;
  date: string;
  venue_name?: string;
  attendee_count?: number;
  photo_count?: number;
}

const ALL_YEARS = 'all';
const ARCHIVE_CARD_ASPECT = '3 / 4';

export default function ArchiveScreen() {
  const router = useRouter();
  const [years, setYears] = useState<string[]>([String(new Date().getFullYear())]);
  const [year, setYear] = useState<string>(ALL_YEARS);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadEventId, setUploadEventId] = useState<string | undefined>();
  const [uploadEdition, setUploadEdition] = useState<number | undefined>();
  const [archives, setArchives] = useState<ApiEvent[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(true);
  const [archiveError, setArchiveError] = useState(false);

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then((r) => r.json())
      .then((d: { event?: ApiEvent }) => {
        if (d.event) {
          setUploadEventId(d.event.id);
          setUploadEdition(d.event.edition_number);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/events/archive?yearsOnly=1')
      .then((r) => r.json())
      .then((d: { years?: string[] }) => {
        if (d.years?.length) {
          setYears(d.years);
          setYear((y) => (y === ALL_YEARS || d.years?.includes(y) ? y : ALL_YEARS));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoadingArchive(true);
    setArchiveError(false);
    fetch(`/api/events/archive?year=${year}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.events) setArchives(d.events);
        else setArchives([]);
      })
      .catch(() => setArchiveError(true))
      .finally(() => setLoadingArchive(false));
  }, [year]);

  const entries = archives;

  const { isWide } = useResponsive();
  const pageColumn = useAppPageColumn();

  useAppHeader({ title: 'Archive' });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      <div
        className="hof-scroll hof-app-page-scroll"
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingTop: isWide ? layoutChrome.wideActionsInset : layoutChrome.mobilePageHeaderInset,
          paddingBottom: isWide ? layoutChrome.wideScrollBottom : layoutChrome.mobileScrollBottom,
        }}
      >
        <div style={{ ...pageColumn, paddingTop: isWide ? 8 : 12 }}>
          {/* Year filter */}
          <div
            className="hof-scroll"
            style={{
              padding: '0 0 16px',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {[ALL_YEARS, ...years].map((y) => (
              <button
                key={y}
                className="hof-btn hof-press"
                onClick={() => setYear(y)}
                style={{
                  padding: '8px 16px',
                  background: year === y ? colors.amber : colors.surface,
                  border: `1px solid ${year === y ? colors.amber : colors.border}`,
                  color: year === y ? colors.bg : colors.text,
                  borderRadius: 999,
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: 13,
                  flexShrink: 0,
                  textTransform: y === ALL_YEARS ? 'uppercase' : undefined,
                }}
              >
                {y === ALL_YEARS ? 'All' : y}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loadingArchive ? (
            <div style={{ padding: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <FeedSkeletonCard key={i} />
              ))}
            </div>
          ) : archiveError ? (
            <div>
              <EmptyState
                title="Could not load events"
                body="Check your connection and try again."
              />
            </div>
          ) : (
            <div
              style={{
                padding: '0 0 24px',
                display: 'grid',
                gridTemplateColumns: isWide ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                gap: 8,
                alignItems: 'stretch',
              }}
            >
              {entries.map((e, i) => {
                const eventYear = e.date.slice(0, 4);
                const formattedDate = new Date(e.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <button
                    key={e.id}
                    type="button"
                    className="hof-btn hof-press"
                    onClick={() => router.push(archiveThemePath(e.edition_number))}
                    style={{
                      textAlign: 'left',
                      padding: 0,
                      background: 'transparent',
                      borderRadius: 10,
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    {/* Photo card */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: ARCHIVE_CARD_ASPECT,
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={photoSrc(i)}
                        alt=""
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {/* Gradient + meta */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, transparent, rgba(10,10,8,0.95))',
                          padding: '40px 12px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'Inter',
                            fontSize: 9,
                            color: colors.amber,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            marginBottom: 2,
                          }}
                        >
                          {formattedDate} · {eventYear}
                        </div>
                        <div
                          style={{
                            fontFamily: 'Clash Display',
                            fontWeight: 600,
                            fontSize: 18,
                            color: colors.text,
                            letterSpacing: '-0.01em',
                            lineHeight: 1.05,
                          }}
                        >
                          {e.name}
                        </div>
                        {typeof e.attendee_count === 'number' ||
                        typeof e.photo_count === 'number' ? (
                          <div
                            style={{
                              fontFamily: 'Inter',
                              fontSize: 10,
                              color: colors.textSec,
                              marginTop: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            {typeof e.attendee_count === 'number' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Icon name="users" size={10} color={colors.textSec} />
                                {e.attendee_count.toLocaleString('en-US')}
                              </span>
                            ) : null}
                            {typeof e.photo_count === 'number' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Icon name="image" size={10} color={colors.textSec} />
                                {e.photo_count.toLocaleString('en-US')}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {/* Theme badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontFamily: 'JetBrains Mono',
                          fontSize: 10,
                          color: colors.text,
                          background: 'rgba(10,10,8,0.6)',
                          padding: '3px 7px',
                          borderRadius: 4,
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        N&ordm;{String(e.edition_number).padStart(2, '0')}
                      </div>
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
        </div>
      </div>

      {/* Photo submission FAB */}
      <button
        className="hof-btn hof-press"
        onClick={() => setUploadOpen(true)}
        aria-label="Submit your photos"
        style={{
          position: 'absolute',
          right: 18,
          bottom: isWide ? 24 : 110,
          zIndex: 25,
          height: 48,
          padding: '0 18px 0 14px',
          borderRadius: 24,
          background: colors.amber,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 8px 24px rgba(232,101,26,0.35), 0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        <Icon name="camera" size={18} color={colors.bg} />
        <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500, color: colors.bg }}>
          Submit photos
        </span>
      </button>

      <PhotoSubmitSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        eventId={uploadEventId}
        edition={uploadEdition}
      />
    </div>
  );
}
