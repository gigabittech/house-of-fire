import { createHmac, timingSafeEqual } from 'node:crypto';

const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET ?? 'dev-secret-do-not-use-in-prod';

export function verifyTicketQRData(qrData: string): boolean {
  let parsed: { code?: unknown; eventId?: unknown; sig?: unknown };
  try {
    parsed = JSON.parse(qrData) as { code?: unknown; eventId?: unknown; sig?: unknown };
  } catch {
    return false;
  }

  const { code, eventId, sig } = parsed;

  if (sig === undefined) {
    return true;
  }

  if (typeof code !== 'string' || typeof eventId !== 'string' || typeof sig !== 'string') {
    return false;
  }

  const payload = JSON.stringify({ code, eventId });
  const expected = createHmac('sha256', QR_HMAC_SECRET).update(payload).digest('hex');

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const sigBuf = Buffer.from(sig, 'hex');
    if (expectedBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}
