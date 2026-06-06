import { colors, fontFamilies, layoutChrome } from '@hof/design-tokens';
import { Icon } from './Icon';
import { filterMemberNavItems, type MemberNavItem, type NavId } from './memberNav';

export type { NavId } from './memberNav';

export interface HofBottomNavProps {
  active?: NavId;
  onChange?: (id: NavId) => void;
  /** Hide nav tabs (e.g. Community when feature is off). */
  excludeNavIds?: NavId[];
}

interface NavItem extends MemberNavItem {
  soon?: boolean;
}

/** Floating capsule tab bar — PWA-safe-area aware. */
export function HofBottomNav({
  active = 'home',
  onChange,
  excludeNavIds = [],
}: HofBottomNavProps) {
  const items: NavItem[] = filterMemberNavItems(excludeNavIds);
  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: layoutChrome.mobileNavSafeBottom,
        zIndex: 30,
        background: 'rgba(20,20,18,0.94)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        padding: '4px 6px',
        boxShadow: '0 6px 28px rgba(0,0,0,0.42)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          gap: 2,
        }}
      >
        {items.map((it) => {
          const isActive = active === it.id;
          const c = isActive ? colors.amber : it.soon ? colors.textDis : colors.textSec;
          return (
            <button
              key={it.id}
              type="button"
              className="hof-btn hof-press"
              onClick={() => !it.soon && onChange?.(it.id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: isActive ? '6px 10px' : '6px 4px',
                borderRadius: 999,
                background: isActive ? 'rgba(232,101,26,0.14)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(232,101,26,0.38)'
                  : '1px solid transparent',
                minHeight: 44,
                opacity: it.soon ? 0.6 : 1,
              }}
            >
              <Icon name={it.icon} color={c} size={20} />
              <span
                style={{
                  fontFamily: fontFamilies.body,
                  fontSize: 9,
                  fontWeight: isActive ? 600 : 500,
                  color: c,
                  letterSpacing: '0.04em',
                  lineHeight: '10px',
                  opacity: isActive ? 1 : it.soon ? 0.7 : 0.72,
                }}
              >
                {it.soon ? 'Soon' : it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
