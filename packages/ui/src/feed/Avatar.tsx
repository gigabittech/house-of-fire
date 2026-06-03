import { colors, fontFamilies } from '@hof/design-tokens';
import type { UserRole } from './types';

export interface AvatarProps {
  initials: string;
  userRole?: UserRole;
  size?: number;
}

// Initials avatar with a role-tinted ring (crew = amber gradient).
export function Avatar({ initials, userRole, size = 32 }: AvatarProps) {
  const isCrew = userRole === 'crew';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: isCrew
          ? `linear-gradient(135deg, ${colors.amber}, ${colors.ember})`
          : colors.elevated,
        border: isCrew ? 'none' : `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontFamilies.body,
        fontSize: size * 0.36,
        fontWeight: 600,
        color: isCrew ? colors.bg : colors.text,
        letterSpacing: '-0.01em',
      }}
    >
      {initials}
    </div>
  );
}
