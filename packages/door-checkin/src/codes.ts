/** Normalize QR JSON payload or plain ticket code to uppercase lookup key. */
export function normalizeTicketCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as { code?: unknown };
    if (typeof parsed.code === 'string' && parsed.code.length > 0) {
      return parsed.code.toUpperCase();
    }
  } catch {
    // plain code
  }
  return trimmed.toUpperCase();
}
