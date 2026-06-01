// Typography tokens. Two typefaces: Clash Display (display) + Inter (UI/body).
// JetBrains Mono is reserved for IDs, ticket numbers, and ledger-style data.
// Scale per the design handoff §4.2.

export const fontFamilies = {
  display: "'Clash Display', 'Inter', system-ui, sans-serif",
  body: "'Inter', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSizes = {
  displayXl: 48,
  displayL: 36,
  headingL: 24,
  headingM: 20,
  headingS: 16,
  body: 15,
  bodyS: 13,
  caption: 11,
  mono: 13,
} as const;

export const lineHeights = {
  display: 1.2,
  ui: 1.4,
  body: 1.6,
} as const;

export const letterSpacing = {
  tightHeading: '-0.02em',
  heading: '-0.01em',
  normal: '0',
  caps: '0.08em',
  capsWide: '0.18em',
} as const;

export type FontFamilyToken = keyof typeof fontFamilies;
export type FontSizeToken = keyof typeof fontSizes;
