interface TierBarProps {
  name: string;
  sold: number;
  total: number;
  color: string;
  sub: string;
}

export function TierBar({ name, sold, total, color, sub }: TierBarProps) {
  const pct = (sold / total) * 100;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, system-ui',
            fontWeight: 500,
            fontSize: 13,
            color: 'var(--hof-text)',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--hof-text-sec)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {sold} / {total}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--hof-elevated)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 11,
          color: 'var(--hof-text-sec)',
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}
