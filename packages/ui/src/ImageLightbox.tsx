'use client';

import { colors } from '@hof/design-tokens';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from './Icon';

export interface ImageLightboxProps {
  urls: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({ urls, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const hasMultiple = urls.length > 1;

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) {
        setIndex((i) => (i - 1 + urls.length) % urls.length);
      }
      if (e.key === 'ArrowRight' && hasMultiple) {
        setIndex((i) => (i + 1) % urls.length);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasMultiple, onClose, urls.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + urls.length) % urls.length);
  }, [urls.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % urls.length);
  }, [urls.length]);

  if (urls.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <Icon name="close" size={20} color="#fff" />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <Icon name="arrowL" size={22} color="#fff" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <Icon name="arrowR" size={22} color="#fff" />
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              color: colors.textSec,
              letterSpacing: '0.04em',
            }}
          >
            {index + 1} / {urls.length}
          </div>
        </>
      )}

      <img
        src={urls[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: 4,
          userSelect: 'none',
        }}
      />
    </div>
  );
}
