import { colors, fontFamilies } from '@hof/design-tokens';
import { HofButton } from './HofButton';
import { Icon } from './Icon';

export interface ErrorStateProps {
  title?: string;
  body?: string;
  retry?: () => void;
}

export function ErrorState({
  title = "Couldn't load that",
  body = 'Check your connection and try again. If it keeps happening, text the crew.',
  retry,
}: ErrorStateProps) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          margin: '0 auto 16px',
          background: 'rgba(232,74,26,0.12)',
          border: '1px solid rgba(232,74,26,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="bolt" size={26} color={colors.error} />
      </div>
      <div
        style={{
          fontFamily: fontFamilies.display,
          fontWeight: 600,
          fontSize: 22,
          color: colors.text,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: fontFamilies.body,
          fontSize: 13,
          color: colors.textSec,
          marginTop: 8,
          lineHeight: 1.55,
          maxWidth: 280,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {body}
      </div>
      {retry !== undefined && (
        <div style={{ marginTop: 18 }}>
          <HofButton
            variant="primary"
            onClick={retry}
            icon={<Icon name="arrowR" size={14} color={colors.bg} />}
          >
            Try again
          </HofButton>
        </div>
      )}
    </div>
  );
}
