'use client';

import { colors } from '@hof/design-tokens';
import type { CSSProperties } from 'react';

export type LazyEventPhotoProps = {
  src: string;
  alt?: string;
  objectFit?: CSSProperties['objectFit'];
  style?: CSSProperties;
  className?: string;
};

export function LazyEventPhoto({
  src,
  alt = '',
  objectFit = 'cover',
  style,
  className,
}: LazyEventPhotoProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit,
        display: 'block',
        background: colors.elevated,
        ...style,
      }}
    />
  );
}
