import QRCode from 'qrcode';
import sharp from 'sharp';
import { formatDoorsRange, normalizeEventTime } from '../eventDisplay';
import { loadReceiptLogoDataUri } from './receiptLogo';

export type TicketAttachmentData = {
  code: string;
  qrData: string;
  index: number;
  total: number;
  holderName: string;
  tierName: string;
  event: {
    name: string;
    editionNumber: number;
    date: string;
    venueName: string;
    doorsOpen?: string | null;
    doorsClose?: string | null;
  };
};

const WIDTH = 360;
const HEIGHT = 530;

function parseDoorTime(raw: string): string | null {
  const trimmed = raw.trim();
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (timeMatch) return normalizeEventTime(trimmed);
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    const d = new Date(parsed);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return null;
}

function doorsLabel(event: TicketAttachmentData['event']): string {
  if (!event.doorsOpen?.trim()) return '—';
  const open = parseDoorTime(event.doorsOpen);
  if (!open) return '—';
  const close = event.doorsClose ? parseDoorTime(event.doorsClose) : null;
  return formatDoorsRange(open, close ?? undefined);
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

async function buildTicketSvg(ticket: TicketAttachmentData): Promise<string> {
  const qrPngBase64 = (
    await QRCode.toBuffer(ticket.qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 460,
      color: { dark: '#1a1a1a', light: '#f5f0e8' },
    })
  ).toString('base64');

  const logoSrc = await loadReceiptLogoDataUri();
  const admitLine =
    ticket.total > 1
      ? `Theme ${ticket.event.editionNumber} · Admit one · ${ticket.index} of ${ticket.total}`
      : `Theme ${ticket.event.editionNumber} · Admit one`;

  const tier = truncate(ticket.tierName.toUpperCase(), 14);
  const eventName = truncate(ticket.event.name.toUpperCase(), 28);
  const date = formatEventDate(ticket.event.date);
  const doors = doorsLabel(ticket.event);
  const venue = truncate(ticket.event.venueName, 22);
  const holder = truncate(ticket.holderName, 18);

  const tierWidth = Math.max(44, tier.length * 6.5 + 16);
  const logoMarkup = logoSrc
    ? `<image href="${logoSrc}" x="20" y="52" height="30" width="120" preserveAspectRatio="xMinYMid meet"/>`
    : `<text x="20" y="72" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" letter-spacing="2">HOUSE OF FIRE</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0A0A08"/>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT - 2}" rx="16" fill="#f5f0e8"/>
  <text x="20" y="34" fill="#0A0A08" fill-opacity="0.5" font-family="Arial, Helvetica, sans-serif" font-size="10" letter-spacing="2">${escapeXml(admitLine.toUpperCase())}</text>
  ${logoMarkup}
  <text x="20" y="100" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">${escapeXml(eventName)}</text>
  <rect x="${WIDTH - tierWidth - 20}" y="44" width="${tierWidth}" height="22" rx="4" fill="#E8651A"/>
  <text x="${WIDTH - tierWidth / 2 - 20}" y="59" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="600" text-anchor="middle" letter-spacing="1">${escapeXml(tier)}</text>
  <text x="20" y="138" fill="#0A0A08" fill-opacity="0.5" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="1.5">DATE</text>
  <text x="20" y="156" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="500">${escapeXml(date)}</text>
  <text x="190" y="138" fill="#0A0A08" fill-opacity="0.5" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="1.5">DOORS</text>
  <text x="190" y="156" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="500">${escapeXml(doors)}</text>
  <text x="20" y="182" fill="#0A0A08" fill-opacity="0.5" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="1.5">VENUE</text>
  <text x="20" y="200" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="500">${escapeXml(venue)}</text>
  <text x="190" y="182" fill="#0A0A08" fill-opacity="0.5" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="1.5">HOLDER</text>
  <text x="190" y="200" fill="#0A0A08" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="500">${escapeXml(holder)}</text>
  <circle cx="0" cy="228" r="10" fill="#0A0A08"/>
  <circle cx="${WIDTH}" cy="228" r="10" fill="#0A0A08"/>
  <line x1="16" y1="228" x2="${WIDTH - 16}" y2="228" stroke="#0A0A08" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="5 4"/>
  <image href="data:image/png;base64,${qrPngBase64}" x="65" y="246" width="230" height="230"/>
  <text x="${WIDTH / 2}" y="492" fill="#0A0A08" font-family="Courier New, monospace" font-size="13" font-weight="500" text-anchor="middle" letter-spacing="2">${escapeXml(ticket.code)}</text>
  <text x="${WIDTH / 2}" y="512" fill="#0A0A08" fill-opacity="0.5" font-family="Arial, Helvetica, sans-serif" font-size="11" text-anchor="middle">Show at the door · keep brightness up</text>
</svg>`;
}

/** Full ticket card as PNG (base64, no data-URL prefix). */
export async function buildTicketAttachmentPngBase64(
  ticket: TicketAttachmentData,
): Promise<string> {
  const svg = await buildTicketSvg(ticket);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png.toString('base64');
}

export function ticketAttachmentFilename(code: string): string {
  const safe = code.replace(/[^A-Za-z0-9-]/g, '-');
  return `Ticket-${safe}.png`;
}
