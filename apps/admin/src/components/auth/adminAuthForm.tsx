import { colors } from '@hof/design-tokens';

export const authContentPadding = '8px 20px 24px';

export const authHeadlineStyle: React.CSSProperties = {
  fontFamily: 'Clash Display',
  fontWeight: 700,
  fontSize: 32,
  color: colors.text,
  marginTop: 8,
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
  textTransform: 'uppercase',
};

export const authSubtextStyle: React.CSSProperties = {
  fontFamily: 'Inter',
  fontSize: 14,
  color: colors.textSec,
  marginTop: 8,
  marginBottom: 16,
  lineHeight: 1.5,
};

export function AuthLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 11,
        color: colors.textSec,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 48,
        padding: '0 14px',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.text,
        outline: 'none',
        ...style,
      }}
    />
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        marginTop: 16,
        padding: '10px 14px',
        background: 'rgba(220,38,38,0.1)',
        border: '1px solid rgba(220,38,38,0.3)',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#f87171',
        lineHeight: 1.45,
      }}
    >
      {message}
    </div>
  );
}

export function AuthLegalFooter() {
  return (
    <div
      style={{
        marginTop: 28,
        textAlign: 'center',
        fontFamily: 'Inter',
        fontSize: 11,
        color: colors.textDis,
        lineHeight: 1.6,
      }}
    >
      By continuing you agree to our Terms and Privacy. We don&apos;t sell data, ever.
    </div>
  );
}
