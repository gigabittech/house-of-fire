import { colors, fontFamilies } from '@hof/design-tokens';
import type { UserRole } from './types';

export interface AvatarProps {
  initials: string;
  userRole?: UserRole;
  size?: number;
  src?: string | null;
  alt?: string;
}

// Initials avatar with a role-tinted ring (crew = amber gradient).
export function Avatar({ initials, userRole, size = 32, src, alt }: AvatarProps) {
  const isCrew = userRole === 'crew';
  const photo = src?.trim();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: photo
          ? colors.elevated
          : isCrew
            ? `linear-gradient(135deg, ${colors.amber}, ${colors.ember})`
            : colors.elevated,
        border: isCrew && !photo ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: fontFamilies.body,
        fontSize: size * 0.36,
        fontWeight: 600,
        color: isCrew ? colors.bg : colors.text,
        letterSpacing: '-0.01em',
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={alt ?? initials}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
