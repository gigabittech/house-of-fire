import { formatCents, formatDoorsTime } from '@/lib/formatters';

export type DoorReceiptInput = {
  code: string;
  holderName: string;
  email: string;
  phone: string;
  tierName: string;
  payMethod: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  purchasedAt: string;
  event: {
    name: string;
    edition_number: number;
    date: string;
    venue_name: string;
    doors_open: string;
    doors_close: string;
  };
};

export function doorSaleReceiptText(input: DoorReceiptInput): string {
  const ev = input.event;
  const dateLabel = new Date(`${ev.date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const doors = `${formatDoorsTime(ev.doors_open)} — ${formatDoorsTime(ev.doors_close)}`;
  const purchased = new Date(input.purchasedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return [
    'HOUSE OF FIRE — DOOR SALE RECEIPT',
    '================================',
    `Event: ${ev.name} · Edition ${ev.edition_number}`,
    `Date: ${dateLabel}`,
    `Venue: ${ev.venue_name}`,
    `Doors: ${doors}`,
    '',
    'Guest',
    `Name: ${input.holderName}`,
    `Email: ${input.email}`,
    ...(input.phone.trim() ? [`Phone: ${input.phone}`] : []),
    `Tier: ${input.tierName}`,
    `Ticket code: ${input.code}`,
    '',
    'Payment',
    `Method: ${input.payMethod}`,
    `Subtotal: ${formatCents(input.subtotalCents)}`,
    `Service fee: ${formatCents(input.feeCents)}`,
    `Total: ${formatCents(input.totalCents)}`,
    `Sold at door: ${purchased}`,
    '',
    'Show the QR ticket at check-in.',
  ].join('\n');
}
