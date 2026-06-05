// @hof/design-tokens — the single source of truth for House of Fire design
// values, consumed by @hof/ui and the app surfaces. CSS custom properties
// mirroring these live in ./tokens.css.

export type { BreakpointToken } from './breakpoints';
export { breakpoints, layoutChrome, layoutWidth, sidebarWidth } from './breakpoints';
export type { ColorToken } from './colors';
export { colors } from './colors';
export type { DurationToken } from './motion';
export { durations, easings, keyframes } from './motion';
export type { RadiusToken } from './radii';
export { radii } from './radii';
export type { ShadowToken } from './shadows';
export { shadows } from './shadows';
export type { SpacingToken } from './spacing';
export { spacing } from './spacing';
export type { FontFamilyToken, FontSizeToken } from './typography';
export {
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacing,
  lineHeights,
} from './typography';

import { breakpoints, layoutChrome, layoutWidth, sidebarWidth } from './breakpoints';
import { colors } from './colors';
import { durations, easings, keyframes } from './motion';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamilies, fontSizes, fontWeights, letterSpacing, lineHeights } from './typography';

/** Every token, grouped — handy for a single import. */
export const tokens = {
  colors,
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  spacing,
  radii,
  durations,
  easings,
  keyframes,
  shadows,
  breakpoints,
  layoutChrome,
  layoutWidth,
  sidebarWidth,
} as const;
