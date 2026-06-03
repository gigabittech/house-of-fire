interface PillProps {
  tone?: 'amber' | 'neutral' | 'success' | 'danger' | 'warning' | 'gold' | 'crew' | 'muted';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Pill({ tone = 'neutral', size = 'sm', children }: PillProps) {
  const toneStyles: Record<string, { bg: string; color: string; border: string }> = {
    amber: {
      bg: 'rgba(232,101,26,0.15)',
      color: 'var(--hof-amber)',
      border: 'rgba(232,101,26,0.3)',
    },
    neutral: {
      bg: 'var(--hof-elevated)',
      color: 'var(--hof-text-sec)',
      border: 'var(--hof-border)',
    },
    success: {
      bg: 'rgba(76,175,110,0.15)',
      color: 'var(--hof-success)',
      border: 'rgba(76,175,110,0.3)',
    },
    danger: {
      bg: 'rgba(232,74,26,0.15)',
      color: 'var(--hof-error)',
      border: 'rgba(232,74,26,0.3)',
    },
    warning: {
      bg: 'rgba(232,162,26,0.15)',
      color: 'var(--hof-warning)',
      border: 'rgba(232,162,26,0.3)',
    },
    gold: { bg: 'rgba(201,148,42,0.15)', color: 'var(--hof-gold)', border: 'rgba(201,148,42,0.3)' },
    crew: { bg: 'rgba(74,138,232,0.15)', color: 'var(--hof-info)', border: 'rgba(74,138,232,0.3)' },
    muted: { bg: 'var(--hof-elevated)', color: 'var(--hof-text-dis)', border: 'var(--hof-border)' },
  };
  const fallback = {
    bg: 'var(--hof-elevated)',
    color: 'var(--hof-text-sec)',
    border: 'var(--hof-border)',
  };
  const style = toneStyles[tone] ?? fallback;
  const padding = size === 'sm' ? '2px 7px' : '4px 10px';
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: 8,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontFamily: 'Inter, system-ui',
        fontSize,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
