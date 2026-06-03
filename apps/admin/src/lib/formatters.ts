export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatEventListDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatGross(cents: number): string {
  if (cents <= 0) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatDoorsTime(raw: string | null | undefined): string {
  if (!raw) return '—';
  const t = raw.trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (!match) return raw;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: m === 0 ? undefined : '2-digit',
  });
}

export function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function formatJoined(memberSince: string): string {
  const days = daysSince(memberSince);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'}`;
  return formatShortDate(memberSince);
}
