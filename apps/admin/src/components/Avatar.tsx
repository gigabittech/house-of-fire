interface AvatarProps {
  initials: string;
  size?: number;
  src?: string | null;
  alt?: string;
}

export function Avatar({ initials, size = 32, src, alt }: AvatarProps) {
  const photo = src?.trim();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: photo
          ? 'var(--hof-elevated)'
          : 'linear-gradient(135deg, var(--hof-amber), var(--hof-ember))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui',
        fontSize: size * 0.38,
        fontWeight: 600,
        color: 'var(--hof-bg)',
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={alt ?? initials.slice(0, 2).toUpperCase()}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initials.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
