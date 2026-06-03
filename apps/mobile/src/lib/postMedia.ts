export function parseMediaUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && u.startsWith('http')).slice(0, 5);
}
