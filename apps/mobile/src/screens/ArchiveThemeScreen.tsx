'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import { EmptyState, FeedSkeletonCard, useResponsive } from '@hof/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useAppPageColumn } from '@/hooks/useAppPageColumn';
import { photoSrc } from '../data/photos';

interface ApiEvent {
  edition_number: number;
  name: string;
  date: string;
  venue_name?: string;
}

interface ApiPhoto {
  id: string;
  public_url: string | null;
  storage_path: string;
  created_at: string;
}

function resolveArchiveEdition(pathname: string, searchParams: URLSearchParams): number | null {
  const fromQuery = searchParams.get('edition');
  if (fromQuery && /^\d+$/.test(fromQuery)) return Number(fromQuery);
  const fromPath = pathname.match(/^\/archive\/(\d+)\/?$/)?.[1];
  if (fromPath) return Number(fromPath);
  return null;
}

export default function ArchiveThemeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const edition = useMemo(
    () => resolveArchiveEdition(pathname, searchParams),
    [pathname, searchParams],
  );
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [photos, setPhotos] = useState<ApiPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleBack = useCallback(() => router.push('/archive'), [router]);

  const { isWide } = useResponsive();
  const pageColumn = useAppPageColumn();

  useAppHeader({
    title: event ? `Theme ${event.edition_number}` : 'Theme',
    onBack: handleBack,
  });

  useEffect(() => {
    if (edition == null) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);
    fetch(`/api/archive/${edition}/photos`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed'))))
      .then((d: { event?: ApiEvent; photos?: ApiPhoto[] }) => {
        setEvent(d.event ?? null);
        setPhotos(d.photos ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [edition]);

  const formattedDate = event
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

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
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <FeedSkeletonCard key={i} />
              ))}
            </div>
          ) : error || !event ? (
            <EmptyState
              title="Could not load theme"
              body="Check your connection and try again."
            />
          ) : (
            <>
              <div style={{ paddingBottom: 16 }}>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    color: colors.amber,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  Theme N&ordm;{String(event.edition_number).padStart(2, '0')} · {formattedDate}
                </div>
                <div
                  style={{
                    fontFamily: 'Clash Display',
                    fontWeight: 600,
                    fontSize: 28,
                    color: colors.text,
                    marginTop: 6,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                  }}
                >
                  {event.name}
                </div>
                {event.venue_name ? (
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 13,
                      color: colors.textSec,
                      marginTop: 8,
                    }}
                  >
                    {event.venue_name}
                  </div>
                ) : null}
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: colors.textSec,
                    marginTop: 10,
                  }}
                >
                  {photos.length} photo{photos.length === 1 ? '' : 's'}
                </div>
              </div>

              {photos.length === 0 ? (
                <EmptyState
                  title="No photos yet"
                  body="Approved photos from this night will show up here."
                />
              ) : (
                <div
                  style={{
                    padding: '0 0 24px',
                    display: 'grid',
                    gridTemplateColumns: isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                    gap: 8,
                    alignItems: 'stretch',
                  }}
                >
                  {photos.map((photo, i) => {
                    const src = photo.public_url ?? photoSrc(i);
                    return (
                      <div
                        key={photo.id}
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: colors.elevated,
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={src}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 8,
                            fontFamily: 'JetBrains Mono',
                            fontSize: 10,
                            color: colors.text,
                            background: 'rgba(10,10,8,0.6)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {String(i + 1).padStart(3, '0')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
