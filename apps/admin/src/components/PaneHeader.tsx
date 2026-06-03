interface PaneHeaderProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  cta?: React.ReactNode;
}

export function PaneHeader({ eyebrow = 'Admin', title, sub, cta }: PaneHeaderProps) {
  return (
    <div
      style={{
        padding: '22px 28px 18px',
        borderBottom: '1px solid var(--hof-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 10,
            color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: 'Clash Display, system-ui',
            fontWeight: 600,
            fontSize: 26,
            color: 'var(--hof-text)',
            letterSpacing: '-0.01em',
            marginTop: 4,
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {cta}
    </div>
  );
}
