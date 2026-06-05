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

/** App-shell sidebar rail widths — shared by the member and admin shells. */
export const sidebarWidth = {
  /** Full sidebar with labels (desktop). */
  full: 200,
  /** Icon-only rail (tablet). */
  rail: 68,
} as const;

/**
 * Shared chrome offsets for mobile safe areas + navigation.
 * Use as inline-style values (CSS calc strings).
 */
export const layoutChrome = {
  /** Shared app header content row height (excludes safe-area padding). */
  headerRowHeight: 34,
  /** Overlay header offset from the top of the viewport. */
  mobileHeaderTop: 'calc(8px + env(safe-area-inset-top, 0px))',
  /** Total inset for content sitting below the mobile page header overlay. */
  mobilePageHeaderInset: 'calc(48px + env(safe-area-inset-top, 0px))',
  /** Bottom tab bar inner safe-area padding. */
  mobileNavSafeBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
  /** Scroll content clearance above the floating capsule tab bar. */
  mobileScrollBottom: 'calc(72px + max(10px, env(safe-area-inset-bottom, 0px)))',
  /** Floating capsule tab bar approximate height (icons + labels + padding). */
  mobileNavHeight: 56,
  wideScrollBottom: 24,
  /** Main-column top inset — clears floating wide-screen action icons (px). */
  wideActionsInset: 58,
  /** Community channel-pill bar height below the action inset (px). */
  wideChannelBarHeight: 52,
  /** Sticky checkout CTA bar height above safe area (steps 1–2, px). */
  mobileCheckoutCtaHeight: 148,
} as const;

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
