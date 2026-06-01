/** Resolve a photo seed (0-based index) to a public asset URL. */

const PHOTO_PATHS: readonly string[] = [
  '/assets/photos/p1-laser-dj.jpg',
  '/assets/photos/p2-green-stage.jpg',
  '/assets/photos/p3-portal-dj.jpg',
  '/assets/photos/p4-m3dium-blue.jpg',
  '/assets/photos/p5-lasers-lace.jpg',
  '/assets/photos/p6-crowd.jpg',
  '/assets/photos/p7-groove.jpg',
] as const;

const FALLBACK = '/assets/photos/p1-laser-dj.jpg';

export function photoSrc(seed: number): string {
  const path = PHOTO_PATHS[seed % PHOTO_PATHS.length];
  return path ?? FALLBACK;
}

export { PHOTO_PATHS };
