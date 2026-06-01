// Shadows / glows lifted from prototype usage.

export const shadows = {
  glow: '0 0 24px 4px rgba(232, 101, 26, 0.25)', // hof-glow peak
  logoGlow: 'drop-shadow(0 2px 6px rgba(232, 101, 26, 0.3))', // nav emblem
  heroText: 'drop-shadow(0 6px 24px rgba(0, 0, 0, 0.5))', // hero wordmark
  card: '0 24px 80px rgba(0, 0, 0, 0.3)', // elevated window
} as const;

export type ShadowToken = keyof typeof shadows;
