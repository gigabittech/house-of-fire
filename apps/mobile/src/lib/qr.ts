import { createHmac, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';

const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET ?? 'dev-secret-do-not-use-in-prod';

const QR_RENDER_OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 2,
  width: 400,
  color: { dark: '#1a1a1a', light: '#f5f0e8' },
};

export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, QR_RENDER_OPTIONS);
}

/** PNG QR for email attachments (base64, no data-URL prefix). */
export async function renderTicketQrPngBase64(qrData: string): Promise<string> {
  const buffer = await QRCode.toBuffer(qrData, QR_RENDER_OPTIONS);
  return Buffer.from(buffer).toString('base64');
}

export function buildTicketQRData(ticketCode: string, eventId: string): string {
  const payload = JSON.stringify({ code: ticketCode, eventId });
  const sig = createHmac('sha256', QR_HMAC_SECRET).update(payload).digest('hex');
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

  // No sig field — legacy ticket, allow through
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
