'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import { eventPhotoGridUrl, eventPhotoLightboxUrl } from '@hof/media';
import {
  EmptyState,
  ErrorState,
  FeedSkeletonCard,
  ImageLightbox,
  useResponsive,
  VirtualPhotoGrid,
} from '@hof/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useAppPageColumn } from '@/hooks/useAppPageColumn';
import { useEventPhotoGallery } from '@/hooks/useEventPhotoGallery';
import { photoSrc } from '../data/photos';

interface ApiEvent {
  edition_number: number;
  name: string;
  date: string;
  venue_name?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const edition = useMemo(
    () => resolveArchiveEdition(pathname, searchParams),
    [pathname, searchParams],
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleBack = useCallback(() => router.push('/archive'), [router]);
  const { isWide } = useResponsive();
  const pageColumn = useAppPageColumn();
  const columns = isWide ? 4 : 2;

  const galleryPath = edition != null ? `/api/archive/${edition}/photos` : '';
  const { photos, eventMeta, totalCount, hasMore, loading, loadingMore, error, refresh, loadMore } =
    useEventPhotoGallery<ApiEvent>(galleryPath);

  const event = eventMeta;

  useAppHeader({
    title: event ? `Theme ${event.edition_number}` : 'Theme',
    onBack: handleBack,
  });

  useEffect(() => {
    if (edition == null) return;
    void refresh();
  }, [edition, refresh]);

  const gridItems = useMemo(
    () =>
      photos.map((photo, index) => ({
        id: photo.id,
        src: eventPhotoGridUrl(photo) ?? photo.public_url ?? photoSrc(index),
        label: String(index + 1).padStart(3, '0'),
      })),
    [photos],
  );

  const lightboxUrls = useMemo(
    () =>
      photos.map(
        (photo, index) => eventPhotoLightboxUrl(photo) ?? photo.public_url ?? photoSrc(index),
      ),
    [photos],
  );

  const formattedDate = event
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const photoCount = totalCount ?? photos.length;

  if (edition == null) {
    return (
      <div style={{ padding: 24, background: colors.bg, height: '100%' }}>
        <EmptyState title="Invalid theme" body="This archive link is not valid." />
      </div>
    );
  }

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
        ref={scrollRef}
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
            <ErrorState retry={() => void refresh()} />
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
                  {photoCount.toLocaleString('en-US')} photo{photoCount === 1 ? '' : 's'}
                </div>
              </div>

              {photos.length === 0 ? (
                <EmptyState
                  title="No photos yet"
                  body="Approved photos from this night will show up here."
                />
              ) : (
                <div style={{ padding: '0 0 24px' }}>
                  <VirtualPhotoGrid
                    items={gridItems}
                    columns={columns}
                    scrollRef={scrollRef}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={() => void loadMore()}
                    onItemClick={(_item, index) => setLightboxIndex(index)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {lightboxIndex != null && lightboxUrls[lightboxIndex] ? (
        <ImageLightbox
          urls={lightboxUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </div>
  );
}
