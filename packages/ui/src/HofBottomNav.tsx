import { colors } from '@hof/design-tokens';
import { Icon, type IconName } from './Icon.js';

export type NavId = 'home' | 'events' | 'community' | 'profile';

export interface HofBottomNavProps {
  active?: NavId;
  onChange?: (id: NavId) => void;
}

interface NavItem {
  id: NavId;
  label: string;
  icon: IconName;
  soon?: boolean;
}

const items: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'events', label: 'Events', icon: 'calendar' },
  { id: 'community', label: 'Community', icon: 'chat' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export function HofBottomNav({ active = 'home', onChange }: HofBottomNavProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(20,20,18,0.92)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        borderTop: `1px solid ${colors.border}`,
        paddingBottom: 34, // home indicator safe area
        zIndex: 30,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '8px 0 6px' }}>
        {items.map((it) => {
          const isActive = active === it.id;
          const c = isActive ? colors.amber : it.soon ? colors.textDis : colors.textSec;
          return (
            <button
              key={it.id}
              type="button"
              className="hof-btn"
              onClick={() => !it.soon && onChange?.(it.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 0',
                opacity: it.soon ? 0.6 : 1,
              }}
            >
              <Icon name={it.icon} color={c} size={22} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: c,
                  letterSpacing: '0.04em',
                  opacity: isActive ? 1 : it.soon ? 0.7 : 0,
                  height: 12,
                  lineHeight: '12px',
                }}
              >
                {it.soon ? 'Soon' : it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
