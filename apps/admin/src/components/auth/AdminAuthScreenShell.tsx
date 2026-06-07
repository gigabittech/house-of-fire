'use client';

import { colors } from '@hof/design-tokens';
import { HofLogoMark } from '@hof/ui';

export function AdminAuthScreenShell({
  children,
  progressStep,
}: {
  children: React.ReactNode;
  progressStep?: 1 | 2 | 3;
}) {
  return (
    <div className="hof-auth-shell" style={{ background: colors.bg }}>
      <div className="hof-scroll hof-auth-scroll">
        <div className="hof-auth-scroll-inner">
          <div className="hof-auth-scroll-content">
            <div
              style={{
                paddingTop: 28,
                paddingLeft: 20,
                paddingRight: 20,
                paddingBottom: 8,
              }}
            >
              <div className="hof-auth-logo">
                <HofLogoMark
                  fit="wordmark"
                  src="/assets/hof-logo.png"
                  width={128}
                  alt="House of Fire"
                />
              </div>
            </div>

            {progressStep ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '24px 0 8px',
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
      </div>
    </div>
  );
}
