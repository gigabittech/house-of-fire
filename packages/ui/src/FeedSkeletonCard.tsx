import { colors } from '@hof/design-tokens';
import { HofSkeleton } from './HofSkeleton.js';

export function FeedSkeletonCard() {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <HofSkeleton width={32} height={32} radius={16} />
        <div style={{ flex: 1 }}>
          <HofSkeleton width="35%" height={12} />
          <HofSkeleton width="22%" height={10} style={{ marginTop: 6 }} />
        </div>
      </div>
      <HofSkeleton width="80%" height={18} style={{ marginTop: 14 }} />
      <HofSkeleton width="100%" height={12} style={{ marginTop: 10 }} />
      <HofSkeleton width="90%" height={12} style={{ marginTop: 6 }} />
      <HofSkeleton width="50%" height={12} style={{ marginTop: 6 }} />
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <HofSkeleton width={70} height={24} radius={12} />
        <HofSkeleton width={70} height={24} radius={12} />
      </div>
    </div>
  );
}
