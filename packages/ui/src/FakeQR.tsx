export interface FakeQRProps {
  size?: number;
  fg?: string;
  bg?: string;
}

// Decorative QR — looks legit at a glance, with real finder patterns.
// Deterministic (seeded LCG) so it renders identically every time.
export function FakeQR({ size = 220, fg = '#0A0A08', bg = '#F0EDE6' }: FakeQRProps) {
  const N = 25;
  const mods: number[][] = [];
  let s = 1337;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let y = 0; y < N; y++) {
    const row: number[] = [];
    for (let x = 0; x < N; x++) row.push(rand() > 0.55 ? 1 : 0);
    mods.push(row);
  }

  // Stamp 7×7 finder patterns at three corners + clear a quiet ring.
  const stamp = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      const row = mods[oy + y];
      if (!row) continue;
      for (let x = 0; x < 7; x++) {
        const onEdge = x === 0 || y === 0 || x === 6 || y === 6;
        const onInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        row[ox + x] = onEdge || onInner ? 1 : 0;
      }
    }
    for (let i = 0; i < 8; i++) {
      const bottomRing = mods[oy + 7];
      if (oy + 7 < N && bottomRing && ox + i < N) bottomRing[ox + i] = 0;
      const sideRow = mods[oy + i];
      if (ox + 7 < N && sideRow) sideRow[ox + 7] = 0;
    }
  };
  stamp(0, 0);
  stamp(N - 7, 0);
  stamp(0, N - 7);

  const cell = size / N;
  return (
    <div
      style={{
        width: size,
        height: size,
        background: bg,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        borderRadius: 6,
      }}
    >
      {mods.flat().map((v, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static deterministic grid
        <div key={i} style={{ width: cell, height: cell, background: v ? fg : bg }} />
      ))}
    </div>
  );
}
