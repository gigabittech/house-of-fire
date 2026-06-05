'use client';

import { colors } from '@hof/design-tokens';
import { HofLogoMark, useResponsive } from '@hof/ui';

export function AuthScreenShell({
  children,
  progressStep,
}: {
  children: React.ReactNode;
  /** Active step (1–3) for the progress dots below the logo. */
  progressStep?: 1 | 2 | 3;
}) {
  const { isWide } = useResponsive();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 520px)' : 'auto',
          overflowY: 'auto',
          paddingBottom: 32,
        }}
      >
        <div
          style={{
            paddingTop: 'calc(28px + env(safe-area-inset-top, 0px))',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 12,
          }}
        >
          <HofLogoMark
            fit="wordmark"
            src="/assets/hof-logo.png"
            width={isWide ? 120 : 108}
            alt="House of Fire"
          />
        </div>

        {progressStep ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '4px 0 8px',
            }}
          >
            {([1, 2, 3] as const).map((i) => (
              <div
                key={i}
                style={{
                  width: i === progressStep ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i <= progressStep ? colors.amber : colors.elevated,
                  transition: 'width 200ms',
                }}
              />
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
