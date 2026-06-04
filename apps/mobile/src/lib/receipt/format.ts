export function formatReceiptCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatReceiptCode(code: string): string {
  return code.replace(/-/g, '—');
}

export function formatIssuedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatEventDateTime(dateStr: string, doorsOpen?: string | null): string {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  if (!doorsOpen?.trim()) return datePart;
  const timePart = formatDoorTimeForReceipt(doorsOpen);
  return timePart ? `${datePart} · ${timePart}` : datePart;
}

function formatDoorTimeForReceipt(raw: string): string | null {
  const trimmed = raw.trim();
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (timeMatch) {
    const h = Number.parseInt(timeMatch[1] ?? '0', 10);
    const m = timeMatch[2] ?? '00';
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${period}`;
  }
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return null;
}

export function feePercentLabel(subtotalCents: number, feeCents: number): string {
  if (subtotalCents <= 0 || feeCents <= 0) return 'Service fee';
  const pct = Math.round((feeCents / subtotalCents) * 100);
  return pct > 0 ? `Service fee (${pct}%)` : 'Service fee';
}
