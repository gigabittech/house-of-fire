// Motion tokens. Minimal and intentional (handoff §4.7).
// Durations are milliseconds.

export const durations = {
  press: 80, // button scale(0.97)
  fade: 150, // page transitions
  image: 200, // image fade-in
  sheet: 300, // bottom sheet slide-up
} as const;

export const easings = {
  out: 'ease-out',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Keyframe names defined in tokens.css.
export const keyframes = {
  shimmer: 'hof-shimmer',
  pulse: 'hof-pulse',
  glow: 'hof-glow',
  scanline: 'hof-scanline',
} as const;

export type DurationToken = keyof typeof durations;
