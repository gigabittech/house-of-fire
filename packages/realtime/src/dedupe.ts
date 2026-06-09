const MAX_KEYS = 500;

function dedupeKey(table: string, id: string, eventType: string, commitTimestamp?: string): string {
  return `${table}:${id}:${eventType}:${commitTimestamp ?? 'na'}`;
}

export class RealtimeDedupe {
  private seen = new Set<string>();
  private order: string[] = [];

  shouldProcess(table: string, id: string, eventType: string, commitTimestamp?: string): boolean {
    const key = dedupeKey(table, id, eventType, commitTimestamp);
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    this.order.push(key);
    if (this.order.length > MAX_KEYS) {
      const oldest = this.order.shift();
      if (oldest) this.seen.delete(oldest);
    }
    return true;
  }

  clear(): void {
    this.seen.clear();
    this.order = [];
  }
}

export function rowId(row: Record<string, unknown> | null | undefined): string {
  if (!row) return '';
  const id = row.id;
  return typeof id === 'string' ? id : String(id ?? '');
}

export function rowsEqual(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): boolean {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
