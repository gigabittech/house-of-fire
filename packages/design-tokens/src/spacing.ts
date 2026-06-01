// Spacing scale. Base unit 4px; every value is a multiple of 4 (handoff §4.3).
// Keys are step multipliers (1 = 4px, 2 = 8px, …).

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export type SpacingToken = keyof typeof spacing;
