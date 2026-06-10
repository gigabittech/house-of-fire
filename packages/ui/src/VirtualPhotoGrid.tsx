'use client';

import { colors } from '@hof/design-tokens';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { LazyEventPhoto } from './LazyEventPhoto';

export type VirtualPhotoGridItem = {
  id: string;
  src: string;
  label?: string;
};

export type VirtualPhotoGridProps = {
  items: VirtualPhotoGridItem[];
  columns: number;
  gap?: number;
  cellAspectRatio?: number;
  scrollRef: RefObject<HTMLElement | null>;
  onItemClick?: (item: VirtualPhotoGridItem, index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

export function VirtualPhotoGrid({
  items,
  columns,
  gap = 8,
  cellAspectRatio = 1,
  scrollRef,
  onItemClick,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: VirtualPhotoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const loadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cellWidth =
    containerWidth > 0 ? (containerWidth - gap * Math.max(0, columns - 1)) / columns : 0;
  const rowHeight = cellWidth > 0 ? cellWidth / cellAspectRatio + gap : 220;
  const rowCount = Math.ceil(items.length / columns) + (hasMore ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 2,
  });

  const virtualRows = virtualizer.getVirtualItems();

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const last = virtualRows[virtualRows.length - 1];
    if (last && last.index >= rowCount - 2) {
      loadMoreRef.current?.();
    }
  }, [hasMore, loadingMore, rowCount, virtualRows]);

  const rows = useMemo(() => {
    const grouped: VirtualPhotoGridItem[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      grouped.push(items.slice(i, i + columns));
    }
    return grouped;
  }, [columns, items]);

  return (
    <div ref={gridRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= rows.length;
          const rowItems = rows[virtualRow.index] ?? [];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: gap,
              }}
            >
              {isLoaderRow ? (
                <div
                  style={{
                    padding: '12px 0',
                    textAlign: 'center',
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: colors.textSec,
                  }}
                >
                  {loadingMore ? 'Loading more photos…' : null}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap,
                  }}
                >
                  {rowItems.map((item, columnIndex) => {
                    const index = virtualRow.index * columns + columnIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="hof-btn"
                        onClick={() => onItemClick?.(item, index)}
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: String(cellAspectRatio),
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: colors.elevated,
                          border: `1px solid ${colors.border}`,
                          padding: 0,
                        }}
                      >
                        <LazyEventPhoto src={item.src} objectFit="contain" />
                        {item.label ? (
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
                            {item.label}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
