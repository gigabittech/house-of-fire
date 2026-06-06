import { colors } from '@hof/design-tokens';

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

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function AuthInput(props: AuthInputProps) {
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

export function AuthPhoneRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: colors.surface,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px 0 14px',
          background: colors.elevated,
          color: colors.textSec,
          fontFamily: 'JetBrains Mono',
          fontSize: 13,
          borderRight: `1px solid ${colors.border}`,
          letterSpacing: '0.04em',
        }}
      >
        +1
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(555) 123-4567"
        type="tel"
        inputMode="tel"
        style={{
          flex: 1,
          height: 48,
          padding: '0 14px',
          background: 'transparent',
          border: 0,
          outline: 'none',
          fontFamily: 'Inter',
          fontSize: 14,
          color: colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      />
    </div>
  );
}

export function AuthDivider() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '22px 0',
      }}
    >
      <div style={{ flex: 1, height: 1, background: colors.border }} />
      <span
        style={{
          fontFamily: 'Inter',
          fontSize: 11,
          color: colors.textSec,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
        }}
      >
        or with email
      </span>
      <div style={{ flex: 1, height: 1, background: colors.border }} />
    </div>
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

/** Shared content inset for sign-in and onboarding steps. */
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
