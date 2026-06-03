interface AvatarProps {
  initials: string;
  size?: number;
}

export function Avatar({ initials, size = 32 }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: 'linear-gradient(135deg, var(--hof-amber), var(--hof-ember))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui',
        fontSize: size * 0.38,
        fontWeight: 600,
        color: 'var(--hof-bg)',
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
