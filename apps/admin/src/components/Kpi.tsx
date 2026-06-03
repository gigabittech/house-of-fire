interface KpiProps {
  label: string;
  value: string;
  delta?: string;
  tone?: 'amber' | 'neutral' | 'warning' | 'muted';
  progress?: number;
}

export function Kpi({ label, value, delta, tone = 'neutral', progress }: KpiProps) {
  const toneColor: Record<string, string> = {
    amber: 'var(--hof-amber)',
    warning: 'var(--hof-warning)',
    neutral: 'var(--hof-text)',
    muted: 'var(--hof-text-sec)',
  };
  const deltaColor = toneColor[tone] ?? 'var(--hof-text)';

  return (
    <div
      style={{
        background: 'var(--hof-surface)',
        border: '1px solid var(--hof-border)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 10,
          color: 'var(--hof-text-sec)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Clash Display, system-ui',
          fontWeight: 600,
          fontSize: 26,
          color: 'var(--hof-text)',
          marginTop: 6,
          letterSpacing: '-0.01em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 11,
            color: deltaColor,
            marginTop: 4,
          }}
        >
          {delta}
        </div>
      )}
      {progress !== undefined && (
        <div
          style={{
            marginTop: 10,
            height: 4,
            background: 'var(--hof-elevated)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--hof-amber)',
              borderRadius: 2,
            }}
          />
        </div>
      )}
    </div>
  );
}
