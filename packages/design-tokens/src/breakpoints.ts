// Layout breakpoints. Mobile-first: 390px (iPhone 14) is the primary canvas.
// The member app is fully adaptive: mobile → tablet → desktop.
//
//   mobile  : < 768px   — single column, bottom tab nav
//   tablet  : 768–1279  — wider column / split-pane, left sidebar nav
//   desktop : ≥ 1280    — multi-column, left sidebar nav, capped content width

export const breakpoints = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
} as const;

export type BreakpointToken = keyof typeof breakpoints;

/** Content column caps — app shell vs marketing/standalone pages. */
export const layoutWidth = {
  /** Authenticated app screens (sidebar + main column). */
  app: 912,
  /** Wider cap for large desktop monitors. */
  appDesktop: 1280,
  /** Landing, onboarding, and similar full-bleed marketing layouts. */
  marketingTablet: 960,
  marketingDesktop: 1280,
} as const;

// Media-query helpers (min-width). Use in CSS-in-JS or matchMedia.
export const mq = {
  tablet: `(min-width: ${breakpoints.tablet}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
} as const;
