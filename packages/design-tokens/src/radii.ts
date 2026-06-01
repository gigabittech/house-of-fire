// Corner radii (handoff §4.4 + values used across the prototype).
// No sharp 0px corners except intentional full-bleed imagery.

export const radii = {
  sm: 4, // badges, tags, status pills
  md: 6, // small chips
  lg: 8, // buttons, input fields
  xl: 10, // mid cards
  '2xl': 12, // cards, panels, image containers
  '3xl': 20, // bottom sheets, modals (top corners)
  full: 9999, // avatars, icon containers
} as const;

export type RadiusToken = keyof typeof radii;
