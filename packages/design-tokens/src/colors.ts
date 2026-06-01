// House of Fire color palette. Dark theme only — there is no light mode.
// Lifted from design/prototypes/hof-ui.jsx (HOF) and the design handoff §4.1.

export const colors = {
  // Surfaces — near-black with a faint warm undertone, stepping lighter.
  bg: '#0A0A08',
  surface: '#141412',
  elevated: '#1E1C19',
  border: '#2A2826',
  borderHi: '#3A3835',

  // Fire — used sparingly as the point of energy.
  amber: '#E8651A', // primary accent
  ember: '#C4401A', // deeper, destructive / contrast
  glow: '#F5942A', // lighter amber, hover / active
  gold: '#C9942A', // muted gold, VIP / badges
  goldDim: '#7A5A18',

  // Text — off-white with warmth, never pure white.
  text: '#F0EDE6',
  textSec: '#8A8880',
  textDis: '#4A4844',

  // Status.
  success: '#4CAF6E',
  warning: '#E8A21A',
  error: '#E84A1A',
  info: '#4A8AE8',
} as const;

export type ColorToken = keyof typeof colors;
