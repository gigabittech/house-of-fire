// @hof/design-tokens — the single source of truth for House of Fire design
// values, consumed by @hof/ui and the app surfaces. CSS custom properties
// mirroring these live in ./tokens.css.

export { colors } from './colors.js';
export type { ColorToken } from './colors.js';
export {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
} from './typography.js';
export type { FontFamilyToken, FontSizeToken } from './typography.js';
export { spacing } from './spacing.js';
export type { SpacingToken } from './spacing.js';
export { radii } from './radii.js';
export type { RadiusToken } from './radii.js';
export { durations, easings, keyframes } from './motion.js';
export type { DurationToken } from './motion.js';
export { shadows } from './shadows.js';
export type { ShadowToken } from './shadows.js';
export { breakpoints } from './breakpoints.js';
export type { BreakpointToken } from './breakpoints.js';

import { colors } from './colors.js';
import {
  fontFamilies,
  fontWeights,
  fontSizes,
  letterSpacing,
  lineHeights,
} from './typography.js';
import { spacing } from './spacing.js';
import { radii } from './radii.js';
import { durations, easings, keyframes } from './motion.js';
import { shadows } from './shadows.js';
import { breakpoints } from './breakpoints.js';

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
} as const;
