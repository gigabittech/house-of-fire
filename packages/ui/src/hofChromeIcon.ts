import type { CSSProperties } from 'react';

export const HOF_CHROME_ICON_SIZE = 40;

/** Single glass circle for header / chrome icon buttons. */
export const hofChromeCircleBtn: CSSProperties = {
  width: HOF_CHROME_ICON_SIZE,
  height: HOF_CHROME_ICON_SIZE,
  borderRadius: HOF_CHROME_ICON_SIZE / 2,
  background: 'rgba(20,20,18,0.62)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(42,40,38,0.7)',
  flexShrink: 0,
  boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
};

export const hofChromeIconRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
};
