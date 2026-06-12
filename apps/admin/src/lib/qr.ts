import { createHmac, timingSafeEqual } from 'node:crypto';

const IS_PROD = process.env.NODE_ENV === 'production';

/** Fail closed in production: a missing/weak secret must never silently sign or verify tickets. */
function qrHmacSecret(): string {
  const secret = process.env.QR_HMAC_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (IS_PROD) throw new Error('QR_HMAC_SECRET must be set (>=16 chars) in production');
  return 'dev-secret-do-not-use-in-prod';
}

export function buildTicketQRData(ticketCode: string, eventId: string): string {
  const payload = JSON.stringify({ code: ticketCode, eventId });
  const sig = createHmac('sha256', qrHmacSecret()).update(payload).digest('hex');
  return JSON.stringify({ code: ticketCode, eventId, sig });
}

export function verifyTicketQRData(qrData: string): boolean {
  let parsed: { code?: unknown; eventId?: unknown; sig?: unknown };
  try {
    parsed = JSON.parse(qrData) as { code?: unknown; eventId?: unknown; sig?: unknown };
  } catch {
    return false;
  }

  const { code, eventId, sig } = parsed;

  // Unsigned QR: only tolerated outside production (dev fixtures / legacy test data).
  if (sig === undefined) {
    return !IS_PROD;
  }

  if (typeof code !== 'string' || typeof eventId !== 'string' || typeof sig !== 'string') {
    return false;
  }

  const payload = JSON.stringify({ code, eventId });
  const expected = createHmac('sha256', qrHmacSecret()).update(payload).digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const sigBuf = Buffer.from(sig, 'hex');
    if (expectedBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}
