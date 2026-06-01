'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colors } from '@hof/design-tokens';
import { Icon, useResponsive } from '@hof/ui';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder');

// ─── Form atoms ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
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

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 48,
        padding: '0 14px',
        background: colors.surface,
        border: `1px solid ${error ? colors.error : colors.border}`,
        borderRadius: 8,
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.text,
        outline: 'none',
        ...(style ?? {}),
      }}
    />
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.error,
        marginTop: 6,
      }}
    >
      {children}
    </div>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.textSec,
        marginTop: 8,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '18px 0',
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
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: colors.border }} />
    </div>
  );
}

function PhoneInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  function format(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: colors.surface,
        borderRadius: 8,
        border: `1px solid ${error ? colors.error : colors.border}`,
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
        onChange={(e) => onChange(format(e.target.value))}
        placeholder="(555) 123-4567"
        type="tel"
        autoComplete="tel"
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

function SaveToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={() => onChange(!on)}
      style={{
        width: '100%',
        marginTop: 22,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: on ? colors.elevated : colors.surface,
        border: on ? `1px solid ${colors.amber}` : `1px solid ${colors.border}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 22,
          borderRadius: 12,
          flexShrink: 0,
          background: on ? colors.amber : colors.border,
          position: 'relative',
          transition: 'background 120ms',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: '#fff',
            transition: 'left 120ms ease-out',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 14,
            color: colors.text,
          }}
        >
          Save my info for next time
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 12,
            color: colors.textSec,
            marginTop: 2,
          }}
        >
          Creates a House of Fire account.
        </div>
      </div>
    </button>
  );
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────

interface TierData {
  name: string;
  price: number;
}

function StepTickets({
  tier,
  setTier,
  qty,
  setQty,
  tierData,
  subtotal,
  fees,
}: {
  tier: string;
  setTier: (t: string) => void;
  qty: number;
  setQty: (q: number) => void;
  tierData: Record<string, TierData>;
  subtotal: number;
  fees: number;
}) {
  return (
    <div>
      <div style={{ padding: '4px 16px 12px' }}>
        <div
          style={{
            fontFamily: 'Clash Display',
            fontWeight: 600,
            fontSize: 24,
            color: colors.text,
            letterSpacing: '-0.01em',
          }}
        >
          Select your tier
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.textSec,
            marginTop: 4,
          }}
        >
          Limited release. Tiers go offline as they sell out.
        </div>
      </div>

      <div
        style={{
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {Object.entries(tierData).map(([id, t]) => (
          <button
            key={id}
            className="hof-btn hof-press"
            onClick={() => setTier(id)}
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              background: tier === id ? colors.elevated : colors.surface,
              border:
                tier === id
                  ? `2px solid ${colors.amber}`
                  : `1px solid ${colors.border}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  border: `1.5px solid ${tier === id ? colors.amber : colors.borderHi}`,
                  background: tier === id ? colors.amber : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tier === id && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: colors.bg,
                    }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: colors.textSec,
                  }}
                >
                  Inclusive of fees
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 20,
                color: colors.text,
              }}
            >
              ${t.price}
            </div>
          </button>
        ))}
      </div>

      {/* Quantity */}
      <div style={{ padding: '24px 16px 8px' }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 10,
            color: colors.textSec,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Quantity · max 4 per order
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: colors.text,
            }}
          >
            Tickets
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="hof-btn hof-press"
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name="minus"
                size={16}
                color={qty === 1 ? colors.textDis : colors.text}
              />
            </button>
            <span
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 20,
                color: colors.text,
                width: 24,
                textAlign: 'center',
              }}
            >
              {qty}
            </span>
            <button
              className="hof-btn hof-press"
              onClick={() => setQty(Math.min(4, qty + 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: colors.amber,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="plus" size={16} color={colors.bg} />
            </button>
          </div>
        </div>
      </div>

      {/* Itemized */}
      <div style={{ padding: '24px 16px 0' }}>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            fontFamily: 'Inter',
            fontSize: 13,
          }}
        >
          {(
            [
              [`${qty}× ${tierData[tier]?.name ?? ''}`, `$${subtotal.toFixed(2)}`],
              ['Service fee', `$${fees.toFixed(2)}`],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                color: colors.textSec,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0 0',
              marginTop: 4,
              borderTop: `1px solid ${colors.border}`,
              color: colors.text,
              fontWeight: 500,
              fontFamily: 'Clash Display',
              fontSize: 16,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>Total</span>
            <span>${(subtotal + fees).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────

interface Details {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

function StepAccount({
  mode,
  setMode,
  details,
  setField,
  errors,
}: {
  mode: 'guest' | 'signup' | 'signin';
  setMode: (m: 'guest' | 'signup' | 'signin') => void;
  details: Details;
  setField: (k: keyof Details, v: string) => void;
  errors: { email?: boolean; phone?: boolean };
}) {
  const isSignIn = mode === 'signin';
  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <div
        style={{
          fontFamily: 'Clash Display',
          fontWeight: 600,
          fontSize: 24,
          color: colors.text,
          letterSpacing: '-0.01em',
        }}
      >
        {isSignIn ? 'Welcome back' : 'Your details'}
      </div>
      <div
        style={{
          fontFamily: 'Inter',
          fontSize: 13,
          color: colors.textSec,
          marginTop: 4,
        }}
      >
        {isSignIn
          ? 'Sign in to your House of Fire account.'
          : 'For your ticket and how the door staff will find you.'}
      </div>

      {isSignIn && (
        <div style={{ marginTop: 22 }}>
          <button
            className="hof-btn hof-press"
            style={{
              width: '100%',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 15,
              color: colors.text,
            }}
          >
            <Icon name="apple" size={16} color={colors.text} />
            Continue with Apple
          </button>
          <Divider>or email</Divider>
          <FieldLabel>Email address</FieldLabel>
          <TextInput
            value={details.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="you@example.com"
            type="email"
          />
          <div style={{ height: 10 }} />
          <FieldLabel>Password</FieldLabel>
          <TextInput
            value={details.password}
            onChange={(e) => setField('password', e.target.value)}
            type="password"
            placeholder="••••••••"
          />
          <button
            className="hof-btn"
            onClick={() => setMode('guest')}
            style={{
              marginTop: 18,
              fontSize: 13,
              color: colors.amber,
              fontWeight: 500,
            }}
          >
            ← Not a member yet? Check out as guest
          </button>
        </div>
      )}

      {!isSignIn && (
        <>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>First name</FieldLabel>
              <TextInput
                value={details.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                placeholder="First"
                autoComplete="given-name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Last name</FieldLabel>
              <TextInput
                value={details.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                placeholder="Last"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div style={{ height: 12 }} />
          <FieldLabel>Email address</FieldLabel>
          <TextInput
            value={details.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            error={errors.email}
          />
          {errors.email && (
            <FieldError>
              Use a valid email — your ticket goes here.
            </FieldError>
          )}

          <div style={{ height: 12 }} />
          <FieldLabel>Phone number</FieldLabel>
          <PhoneInput
            value={details.phone}
            onChange={(v) => setField('phone', v)}
            error={errors.phone}
          />
          <HelperText>
            For ticket SMS and door lookup. We won&apos;t text you otherwise.
          </HelperText>

          <SaveToggle
            on={mode === 'signup'}
            onChange={(on) => setMode(on ? 'signup' : 'guest')}
          />

          {mode === 'signup' && (
            <div style={{ marginTop: 12 }}>
              <FieldLabel>Choose a password</FieldLabel>
              <TextInput
                value={details.password}
                onChange={(e) => setField('password', e.target.value)}
                type="password"
                placeholder="At least 6 characters"
              />
            </div>
          )}

          <button
            className="hof-btn"
            onClick={() => setMode('signin')}
            style={{
              marginTop: 18,
              fontSize: 13,
              color: colors.textSec,
              fontWeight: 500,
            }}
          >
            Already a member?{' '}
            <span style={{ color: colors.amber }}>Sign in →</span>
          </button>
        </>
      )}
    </div>
  );
}

// ─── Promo code section ───────────────────────────────────────────────────────

type PromoResult = {
  valid: boolean;
  code?: string;
  codeId?: string;
  discountCents?: number;
  label?: string;
  error?: string;
};

function PromoCodeSection({
  promoCode,
  setPromoCode,
  promoResult,
  setPromoResult,
  promoLoading,
  onApply,
}: {
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoResult: PromoResult | null;
  setPromoResult: (r: PromoResult | null) => void;
  promoLoading: boolean;
  onApply: () => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ padding: '0 16px 20px' }}>
      <div
        style={{
          fontSize: 10,
          color: colors.textSec,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontFamily: 'Inter',
          marginBottom: 10,
        }}
      >
        Promo code
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') onApply(); }}
          placeholder="Enter code (e.g. FIREFAMILY)"
          style={{
            flex: 1,
            background: colors.elevated,
            border: `1px solid ${focused ? colors.borderHi : colors.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            color: colors.text,
            fontFamily: 'JetBrains Mono',
            fontSize: 14,
            outline: 'none',
            letterSpacing: '0.04em',
          }}
        />
        <button
          className="hof-btn hof-press"
          onClick={onApply}
          disabled={promoLoading || promoCode.trim().length === 0}
          style={{
            padding: '10px 16px',
            background: promoLoading || promoCode.trim().length === 0 ? colors.elevated : colors.amber,
            border: `1px solid ${promoLoading || promoCode.trim().length === 0 ? colors.border : colors.amber}`,
            borderRadius: 8,
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 13,
            color: promoLoading || promoCode.trim().length === 0 ? colors.textDis : colors.bg,
            whiteSpace: 'nowrap',
            opacity: promoLoading || promoCode.trim().length === 0 ? 0.6 : 1,
          }}
        >
          {promoLoading ? '…' : 'Apply'}
        </button>
      </div>

      {/* Feedback */}
      {promoResult !== null && promoResult.valid && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter',
              fontSize: 13,
              color: colors.success,
            }}
          >
            ✓ {promoResult.code ?? promoCode} applied — {promoResult.label ?? 'discount applied'}
          </span>
          <button
            className="hof-btn"
            onClick={() => { setPromoResult(null); setPromoCode(''); }}
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.textSec,
              padding: '2px 6px',
              borderRadius: 4,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {promoResult !== null && !promoResult.valid && (
        <div
          style={{
            marginTop: 8,
            fontFamily: 'Inter',
            fontSize: 13,
            color: colors.error,
          }}
        >
          ✗ {promoResult.error ?? 'Code not found'}
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function StepPaymentInner({
  intentAmount,
  subtotalCents,
  discountCents,
  promoResult,
  setPromoResult,
  promoCode,
  setPromoCode,
  promoLoading,
  onApplyPromo,
  onSuccess,
}: {
  clientSecret: string;
  intentAmount: number;
  subtotalCents: number;
  discountCents: number;
  promoResult: PromoResult | null;
  setPromoResult: (r: PromoResult | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoLoading: boolean;
  onApplyPromo: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState('');

  const discountedSubtotal = subtotalCents - discountCents;
  const feeCents = Math.round(discountedSubtotal * 0.07);
  const displayTotal = discountedSubtotal + feeCents;

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);
    setErr('');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/ticket` },
      redirect: 'if_required',
    });
    setConfirming(false);
    if (error) {
      setErr(error.message ?? 'Payment failed');
    } else {
      onSuccess();
    }
  };

  return (
    <div>
      {/* Promo code section */}
      <PromoCodeSection
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        promoResult={promoResult}
        setPromoResult={setPromoResult}
        promoLoading={promoLoading}
        onApply={onApplyPromo}
      />

      {/* Price breakdown */}
      <div style={{ padding: '0 16px 20px' }}>
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            fontFamily: 'Inter',
            fontSize: 13,
          }}
        >
          {/* Subtotal row — strikethrough when discounted */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontVariantNumeric: 'tabular-nums',
              color: discountCents > 0 ? colors.textDis : colors.textSec,
            }}
          >
            <span>Subtotal</span>
            <span style={{ textDecoration: discountCents > 0 ? 'line-through' : 'none' }}>
              {formatCurrency(subtotalCents)}
            </span>
          </div>

          {/* Discount row */}
          {discountCents > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                fontVariantNumeric: 'tabular-nums',
                color: colors.success,
              }}
            >
              <span>Discount ({promoResult?.code ?? ''})</span>
              <span>−{formatCurrency(discountCents)}</span>
            </div>
          )}

          {/* Discounted subtotal when promo is active */}
          {discountCents > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                fontVariantNumeric: 'tabular-nums',
                color: colors.textSec,
              }}
            >
              <span>After discount</span>
              <span>{formatCurrency(discountedSubtotal)}</span>
            </div>
          )}

          {/* HOF fee */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontVariantNumeric: 'tabular-nums',
              color: colors.textSec,
            }}
          >
            <span>HOF fee (7%)</span>
            <span>{formatCurrency(feeCents)}</span>
          </div>

          {/* Total */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0 0',
              marginTop: 4,
              borderTop: `1px solid ${colors.border}`,
              fontFamily: 'Clash Display',
              fontSize: 16,
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
              color: colors.amber,
            }}
          >
            <span>Total</span>
            <span>{formatCurrency(displayTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment element */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: colors.textSec, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12, marginTop: 4 }}>
          Payment
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: colors.textSec, marginBottom: 16 }}>
          Payments secured by Stripe. 256-bit SSL encryption.
        </div>
        <PaymentElement />
        {err && (
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.error, marginTop: 12 }}>{err}</div>
        )}
        <div style={{ marginTop: 16 }}>
          <button
            className="hof-btn hof-press"
            onClick={() => { void handleConfirm(); }}
            disabled={confirming || !stripe}
            style={{
              width: '100%', padding: '15px', background: confirming ? colors.elevated : colors.amber,
              border: 'none', borderRadius: 12, fontFamily: 'Inter', fontWeight: 600,
              fontSize: 16, color: confirming ? colors.textSec : colors.bg, transition: 'background 150ms',
            }}
          >
            {confirming ? 'Processing…' : `Pay ${formatCurrency(intentAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepPayment({
  clientSecret,
  intentAmount,
  subtotalCents,
  discountCents,
  promoResult,
  setPromoResult,
  promoCode,
  setPromoCode,
  promoLoading,
  onApplyPromo,
  onSuccess,
}: {
  clientSecret: string;
  intentAmount: number;
  subtotalCents: number;
  discountCents: number;
  promoResult: PromoResult | null;
  setPromoResult: (r: PromoResult | null) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  promoLoading: boolean;
  onApplyPromo: () => void;
  onSuccess: () => void;
}) {
  if (!clientSecret) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: 'Inter', fontSize: 14, color: colors.textSec }}>
        Preparing payment…
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#E8651A', colorBackground: '#141412', colorText: '#F0EDE6', borderRadius: '8px' } } }}>
      <StepPaymentInner
        clientSecret={clientSecret}
        intentAmount={intentAmount}
        subtotalCents={subtotalCents}
        discountCents={discountCents}
        promoResult={promoResult}
        setPromoResult={setPromoResult}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        promoLoading={promoLoading}
        onApplyPromo={onApplyPromo}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const { isWide } = useResponsive();
  const searchParams = useSearchParams();
  const tierId = searchParams.get('tierId') ?? '';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qty, setQty] = useState(1);
  const [tier, setTier] = useState(tierId || 'ga');
  const [accountMode, setAccountMode] = useState<'guest' | 'signup' | 'signin'>('guest');
  const [details, setDetails] = useState<Details>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [clientSecret, setClientSecret] = useState('');
  const [intentAmount, setIntentAmount] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const setField = (k: keyof Details, v: string) =>
    setDetails((d) => ({ ...d, [k]: v }));

  const [tierData, setTierData] = useState<Record<string, TierData>>({
    ga: { name: 'General', price: 28 },
    vip: { name: 'VIP', price: 55 },
  });

  useEffect(() => {
    fetch('/api/events/upcoming')
      .then(r => r.json())
      .then((d: { event?: { ticket_tiers: Array<{ id: string; name: string; display_name: string; price_cents: number; status: string }> } }) => {
        if (!d.event?.ticket_tiers) return;
        const built: Record<string, TierData> = {};
        for (const t of d.event.ticket_tiers) {
          if (t.status === 'hidden') continue;
          const priceNum = t.price_cents / 100;
          const tierName = t.display_name || t.name;
          built[t.id] = { name: tierName, price: priceNum };
          // Key by id only — keying by slug too duplicated every tier in the
          // render list AND set `tier` to a slug the checkout API rejects.
        }
        if (Object.keys(built).length > 0) setTierData(built);
      })
      .catch(console.error);
  }, []);

  // Reset promo when tier or quantity changes
  useEffect(() => {
    setPromoResult(null);
  }, [tier, qty]);

  const currentTier = tierData[tierId] ?? tierData[tier] ?? Object.values(tierData).find(Boolean);
  const subtotal = (currentTier?.price ?? 0) * qty;
  // subtotalCents for promo validation and price display
  const subtotalCents = Math.round(subtotal * 100);
  const discountCents = promoResult?.valid ? (promoResult.discountCents ?? 0) : 0;
  const discountedSubtotal = subtotalCents - discountCents;
  const feeCents = Math.round(discountedSubtotal * 0.07);
  const displayTotalCents = discountedSubtotal + feeCents;
  // Legacy fee/total for step 1 display (no promo on that step)
  const fees = Math.round(subtotal * 0.07 * 100) / 100;
  const total = subtotal + fees;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim());
  const phoneDigits = details.phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 10;
  const nameOk =
    details.firstName.trim().length >= 1 &&
    details.lastName.trim().length >= 1;
  const passwordOk =
    accountMode !== 'signup' || details.password.length >= 6;
  const step2Valid =
    accountMode === 'signin'
      ? emailOk && details.password.length >= 1
      : nameOk && emailOk && phoneOk && passwordOk;

  async function applyPromoCode() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const r = await fetch('/api/checkout/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          tierId: tierId || tier,
          subtotalCents,
        }),
      });
      const d = (await r.json()) as PromoResult;
      setPromoResult(d);
      if (d.valid) setPromoCode(d.code ?? code);
    } catch {
      setPromoResult({ valid: false, error: 'Could not validate code' });
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleAdvance() {
    if (step < 3) {
      if (step === 2) {
        setPayLoading(true);
        setPayError('');
        try {
          const r = await fetch('/api/checkout/intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tierId: tierId || tier,
              quantity: qty,
              codeId: promoResult?.valid ? promoResult.codeId : undefined,
              discountCents: promoResult?.valid ? promoResult.discountCents : 0,
            }),
          });
          const d = await r.json() as { clientSecret?: string; amount?: number; error?: string };
          if (d.error || !d.clientSecret) {
            setPayError(d.error ?? 'Could not create payment. Please sign in.');
            setPayLoading(false);
            return;
          }
          setClientSecret(d.clientSecret);
          setIntentAmount(d.amount ?? 0);
        } catch {
          setPayError('Network error. Please try again.');
          setPayLoading(false);
          return;
        }
        setPayLoading(false);
      }
      setStep((s) => (s < 3 ? (s + 1) as 1 | 2 | 3 : s));
      return;
    }
    // Step 3: payment is handled by StepPaymentInner
  }

  const stepNames = ['Tickets', 'Your details', 'Payment'];

  // Display total for the sticky CTA bar (uses discounted total on step 3, base total elsewhere)
  const ctaTotal = step === 3 ? displayTotalCents / 100 : total;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: isWide ? 0 : 54,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 760px)' : 'auto',
          boxSizing: 'border-box',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(10,10,8,0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          className="hof-btn hof-press"
          onClick={() => (step === 1 ? router.back() : setStep((step - 1) as 1 | 2 | 3))}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chev" size={18} color={colors.text} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span
          style={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 16,
            color: colors.text,
          }}
        >
          Checkout
        </span>
        <div style={{ width: 38 }} />
      </div>

      {/* Scrollable content */}
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 760px)' : 'auto',
          overflowY: 'auto',
          paddingBottom: 110,
        }}
      >
        <div style={{ height: isWide ? 60 : 102 }} />

        {/* Step indicator */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {stepNames.map((n, i) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: i < step ? colors.amber : colors.elevated,
                      border: `1px solid ${i + 1 === step ? colors.amber : colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter',
                      fontSize: 11,
                      fontWeight: 600,
                      color: i < step ? colors.bg : colors.textSec,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1 < step ? (
                      <Icon name="check" size={12} color={colors.bg} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 11,
                      fontWeight: 500,
                      color: i + 1 === step ? colors.text : colors.textSec,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {n}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: i < step - 1 ? colors.amber : colors.border,
                      marginLeft: 8,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary chip */}
        <div style={{ padding: '0 16px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="flame" size={16} color={colors.amber} />
              <div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 12,
                    color: colors.text,
                  }}
                >
                  Fireversary — June 26
                </div>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 11,
                    color: colors.textSec,
                  }}
                >
                  Junkyard Social Club
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 13,
                color: colors.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${ctaTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {step === 1 && (
          <StepTickets
            tier={tier}
            setTier={setTier}
            qty={qty}
            setQty={setQty}
            tierData={tierData}
            subtotal={subtotal}
            fees={fees}
          />
        )}
        {step === 2 && (
          <StepAccount
            mode={accountMode}
            setMode={setAccountMode}
            details={details}
            setField={setField}
            errors={{
              email: details.email.length > 0 ? !emailOk : undefined,
              phone: details.phone.length > 0 ? !phoneOk : undefined,
            }}
          />
        )}
        {step === 3 && (
          <StepPayment
            clientSecret={clientSecret}
            intentAmount={intentAmount}
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            promoResult={promoResult}
            setPromoResult={setPromoResult}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            promoLoading={promoLoading}
            onApplyPromo={() => { void applyPromoCode(); }}
            onSuccess={() => router.push('/ticket')}
          />
        )}
      </div>

      {/* Sticky CTA — hidden on step 3 (payment is handled inside Stripe Elements) */}
      {step !== 3 && (
        <div
          style={{
            position: 'absolute',
            left: isWide ? '50%' : 0,
            right: isWide ? 'auto' : 0,
            bottom: 0,
            transform: isWide ? 'translateX(-50%)' : undefined,
            width: isWide ? 'min(100%, 760px)' : 'auto',
            boxSizing: 'border-box',
            zIndex: 30,
            background: 'rgba(20,20,18,0.94)',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${colors.border}`,
            padding: '14px 16px 34px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: 12,
                color: colors.textSec,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Total · {qty} {qty === 1 ? 'ticket' : 'tickets'}
            </span>
            <span
              style={{
                fontFamily: 'Clash Display',
                fontWeight: 600,
                fontSize: 22,
                color: colors.text,
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${total.toFixed(2)}
            </span>
          </div>
          {payError && (
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: colors.error, marginBottom: 8 }}>
              {payError}
            </div>
          )}
          <button
            className="hof-btn hof-press"
            disabled={(step === 2 && !step2Valid) || payLoading}
            onClick={() => { void handleAdvance(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '15px',
              background:
                (step === 2 && !step2Valid) || payLoading ? colors.elevated : colors.amber,
              border: `1px solid ${(step === 2 && !step2Valid) || payLoading ? colors.border : colors.amber}`,
              borderRadius: 12,
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 16,
              color:
                (step === 2 && !step2Valid) || payLoading ? colors.textDis : colors.bg,
              opacity: (step === 2 && !step2Valid) || payLoading ? 0.6 : 1,
            }}
          >
            {step === 1 && 'Continue to your details'}
            {step === 2 && (payLoading ? 'Preparing…' : step2Valid ? 'Continue to payment' : 'Fill in your details')}
          </button>
        </div>
      )}
    </div>
  );
}
