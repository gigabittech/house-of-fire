// screen-checkout.jsx — 3-step checkout: Tickets → Account → Payment → Confirmation

function ScreenCheckout({ onBack, onComplete, startStep = 1 }) {
  const [step, setStep] = React.useState(startStep);
  const [qty, setQty] = React.useState(1);
  const [tier, setTier] = React.useState('ga');
  // mode: 'guest' (default — just enter details) | 'signup' (save for next time) | 'signin' (existing member)
  const [accountMode, setAccountMode] = React.useState('guest');
  const [details, setDetails] = React.useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });
  const setField = (k, v) => setDetails(d => ({ ...d, [k]: v }));

  const tierData = {
    ga:  { name: 'General', price: 28 },
    vip: { name: 'VIP',     price: 55 },
  };
  const t = tierData[tier];
  const subtotal = t.price * qty;
  const fees = Math.round(subtotal * 0.07 * 100) / 100;
  const total = subtotal + fees;

  // Validation for step 2
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim());
  const phoneDigits = details.phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 10;
  const nameOk = details.firstName.trim().length >= 1 && details.lastName.trim().length >= 1;
  const passwordOk = accountMode !== 'signup' || details.password.length >= 6;
  const step2Valid = accountMode === 'signin'
    ? (emailOk && details.password.length >= 1)
    : (nameOk && emailOk && phoneOk && passwordOk);

  const stepNames = ['Tickets', 'Your details', 'Payment'];

  return (
    <HofScreen>
      <HofTopBar title="Checkout" onBack={step === 1 ? onBack : () => setStep(step - 1)}/>

      <HofScroll>
        <div style={{ height: 102 /* topbar */ }}/>

        {/* Step indicator */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {stepNames.map((n, i) => (
              <React.Fragment key={n}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, flex: 1,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    background: i < step ? HOF.amber : HOF.elevated,
                    border: `1px solid ${i + 1 === step ? HOF.amber : HOF.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Inter', fontSize: 11, fontWeight: 600,
                    color: i < step ? HOF.bg : HOF.textSec,
                  }}>
                    {i + 1 < step ? <Icon name="check" size={12} color={HOF.bg}/> : i + 1}
                  </div>
                  <span style={{
                    fontFamily: 'Inter', fontSize: 11, fontWeight: 500,
                    color: i + 1 === step ? HOF.text : HOF.textSec,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{n}</span>
                </div>
                {i < 2 && <div style={{
                  flex: '0 0 16px', height: 1,
                  background: i < step - 1 ? HOF.amber : HOF.border,
                }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Sticky-style summary chip */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: HOF.surface,
            border: `1px solid ${HOF.border}`, borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="flame" size={16} color={HOF.amber}/>
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: HOF.text }}>
                  Fireversary — June 26
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>
                  Junkyard Social Club
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.text,
              fontVariantNumeric: 'tabular-nums',
            }}>${total.toFixed(2)}</div>
          </div>
        </div>

        {step === 1 && (
          <StepTickets tier={tier} setTier={setTier} qty={qty} setQty={setQty}
                       tierData={tierData} subtotal={subtotal} fees={fees} total={total}/>
        )}
        {step === 2 && (
          <StepAccount mode={accountMode} setMode={setAccountMode}
                       details={details} setField={setField}
                       errors={{
                         email: details.email && !emailOk,
                         phone: details.phone && !phoneOk,
                       }}/>
        )}
        {step === 3 && (
          <StepPayment total={total}/>
        )}

        <div style={{ height: 110 }}/>
      </HofScroll>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
        background: 'rgba(20,20,18,0.94)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${HOF.border}`,
        padding: '14px 16px 34px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec,
                         textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Total · {qty} {qty === 1 ? 'ticket' : 'tickets'}
          </span>
          <span style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
            color: HOF.text, letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
          }}>${total.toFixed(2)}</span>
        </div>
        <HofButton variant="primary" full
                   disabled={step === 2 && !step2Valid}
                   onClick={() => {
                     if (step < 3) setStep(step + 1);
                     else onComplete && onComplete();
                   }}>
          {step === 1 && 'Continue to your details'}
          {step === 2 && (step2Valid ? 'Continue to payment' : 'Fill in your details')}
          {step === 3 && `Pay $${total.toFixed(2)}`}
        </HofButton>
      </div>
    </HofScreen>
  );
}

// ─── Step 1: tickets ────────────────────────────────────────────────────────
function StepTickets({ tier, setTier, qty, setQty, tierData, subtotal, fees, total }) {
  return (
    <div>
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{
          fontFamily: 'Clash Display', fontWeight: 600, fontSize: 24, color: HOF.text,
          letterSpacing: '-0.01em',
        }}>Select your tier</div>
        <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 4 }}>
          Limited release. Tiers go offline as they sell out.
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(tierData).map(([id, t]) => (
          <button key={id} className="hof-btn hof-press" onClick={() => setTier(id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    background: tier === id ? HOF.elevated : HOF.surface,
                    border: tier === id ? `2px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9,
                border: `1.5px solid ${tier === id ? HOF.amber : HOF.borderHi}`,
                background: tier === id ? HOF.amber : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tier === id && <div style={{ width: 6, height: 6, borderRadius: 3, background: HOF.bg }}/>}
              </div>
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: HOF.text }}>{t.name}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec }}>Inclusive of fees</div>
              </div>
            </div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20, color: HOF.text,
            }}>${t.price}</div>
          </button>
        ))}
      </div>

      {/* Quantity */}
      <div style={{ padding: '24px 16px 8px' }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12,
        }}>Quantity · max 4 per order</div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: HOF.surface,
          border: `1px solid ${HOF.border}`, borderRadius: 12,
        }}>
          <span style={{ fontFamily: 'Inter', fontSize: 14, color: HOF.text }}>Tickets</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="hof-btn hof-press" onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{ width: 36, height: 36, borderRadius: 18,
                             background: HOF.elevated, border: `1px solid ${HOF.border}`,
                             display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={16} color={qty === 1 ? HOF.textDis : HOF.text}/>
            </button>
            <span style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
                           color: HOF.text, width: 24, textAlign: 'center' }}>{qty}</span>
            <button className="hof-btn hof-press" onClick={() => setQty(Math.min(4, qty + 1))}
                    style={{ width: 36, height: 36, borderRadius: 18,
                             background: HOF.amber, color: HOF.bg,
                             display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={16} color={HOF.bg}/>
            </button>
          </div>
        </div>
      </div>

      {/* Itemized */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          padding: 16, fontFamily: 'Inter', fontSize: 13,
        }}>
          {[
            [`${qty}× ${tierData[tier].name}`, `$${subtotal.toFixed(2)}`],
            ['Service fee', `$${fees.toFixed(2)}`],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', color: HOF.textSec,
              fontVariantNumeric: 'tabular-nums',
            }}>
              <span>{k}</span><span>{v}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0 0', marginTop: 4,
            borderTop: `1px solid ${HOF.border}`,
            color: HOF.text, fontWeight: 500,
            fontFamily: 'Clash Display', fontSize: 16,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>Total</span><span>${(subtotal + fees).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Your details ───────────────────────────────────────────────────
function StepAccount({ mode, setMode, details, setField, errors }) {
  const isSignIn = mode === 'signin';
  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 24, color: HOF.text,
        letterSpacing: '-0.01em',
      }}>{isSignIn ? 'Welcome back' : 'Your details'}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 4 }}>
        {isSignIn
          ? 'Sign in to your House of Fire account.'
          : 'For your ticket and how the door staff will find you.'}
      </div>

      {/* Sign-in path */}
      {isSignIn && (
        <div style={{ marginTop: 22 }}>
          <HofButton variant="quiet" full size="md"
                     icon={<Icon name="apple" size={16} color={HOF.text}/>}>
            Continue with Apple
          </HofButton>
          <Divider>or email</Divider>
          <Label>Email address</Label>
          <Input value={details.email}
                 onChange={e => setField('email', e.target.value)}
                 placeholder="you@example.com" type="email"/>
          <div style={{ height: 10 }}/>
          <Label>Password</Label>
          <Input value={details.password}
                 onChange={e => setField('password', e.target.value)}
                 type="password" placeholder="••••••••"/>
          <button className="hof-btn" onClick={() => setMode('guest')}
                  style={{ marginTop: 18, fontSize: 13, color: HOF.amber, fontWeight: 500 }}>
            ← Not a member yet? Check out as guest
          </button>
        </div>
      )}

      {/* Guest / signup path — required fields */}
      {!isSignIn && <>
        <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Label>First name</Label>
            <Input value={details.firstName}
                   onChange={e => setField('firstName', e.target.value)}
                   placeholder="First" autoComplete="given-name"/>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Last name</Label>
            <Input value={details.lastName}
                   onChange={e => setField('lastName', e.target.value)}
                   placeholder="Last" autoComplete="family-name"/>
          </div>
        </div>

        <div style={{ height: 12 }}/>
        <Label>Email address</Label>
        <Input value={details.email}
               onChange={e => setField('email', e.target.value)}
               placeholder="you@example.com" type="email" autoComplete="email"
               style={errors.email ? { borderColor: HOF.error } : {}}/>
        {errors.email && <FieldError>Use a valid email — your ticket goes here.</FieldError>}

        <div style={{ height: 12 }}/>
        <Label>Phone number</Label>
        <PhoneInput value={details.phone}
                    onChange={v => setField('phone', v)}
                    error={errors.phone}/>
        <Helper>For ticket SMS and door lookup. We won't text you otherwise.</Helper>

        {/* Save-for-next-time toggle */}
        <SaveToggle on={mode === 'signup'}
                    onChange={(on) => setMode(on ? 'signup' : 'guest')}/>

        {mode === 'signup' && (
          <div style={{ marginTop: 12 }}>
            <Label>Choose a password</Label>
            <Input value={details.password}
                   onChange={e => setField('password', e.target.value)}
                   type="password" placeholder="At least 6 characters"/>
          </div>
        )}

        {/* Sign-in link, at the bottom */}
        <button className="hof-btn" onClick={() => setMode('signin')}
                style={{ marginTop: 18, fontSize: 13, color: HOF.textSec, fontWeight: 500 }}>
          Already a member? <span style={{ color: HOF.amber }}>Sign in →</span>
        </button>
      </>}
    </div>
  );
}

// ─── Reused atoms ───────────────────────────────────────────────────────────
function Divider({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: HOF.border }}/>
      <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
                     textTransform: 'uppercase', letterSpacing: '0.16em' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: HOF.border }}/>
    </div>
  );
}

function Helper({ children }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 12, color: HOF.textSec,
    marginTop: 8, lineHeight: 1.45,
  }}>{children}</div>;
}

function FieldError({ children }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 12, color: HOF.error, marginTop: 6,
  }}>{children}</div>;
}

// Phone input — formats US numbers as user types, with +1 chip prefix.
function PhoneInput({ value, onChange, error }) {
  function format(raw) {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: HOF.surface, borderRadius: 8,
      border: `1px solid ${error ? HOF.error : HOF.border}`,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 12px 0 14px',
        background: HOF.elevated, color: HOF.textSec,
        fontFamily: 'JetBrains Mono', fontSize: 13,
        borderRight: `1px solid ${HOF.border}`,
        letterSpacing: '0.04em',
      }}>+1</div>
      <input
        value={value}
        onChange={e => onChange(format(e.target.value))}
        placeholder="(555) 123-4567"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        style={{
          flex: 1, height: 48, padding: '0 14px', background: 'transparent',
          border: 0, outline: 'none',
          fontFamily: 'Inter', fontSize: 14, color: HOF.text,
          fontVariantNumeric: 'tabular-nums',
        }}/>
    </div>
  );
}

function SaveToggle({ on, onChange }) {
  return (
    <button type="button" className="hof-btn hof-press" onClick={() => onChange(!on)}
            style={{
              width: '100%', marginTop: 22, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              background: on ? HOF.elevated : HOF.surface,
              border: on ? `1px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
              borderRadius: 12,
            }}>
      {/* iOS-style switch */}
      <div style={{
        width: 38, height: 22, borderRadius: 12, flexShrink: 0,
        background: on ? HOF.amber : HOF.border,
        position: 'relative', transition: 'background 120ms',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 18 : 2,
          width: 18, height: 18, borderRadius: 9, background: '#fff',
          transition: 'left 120ms ease-out',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>
          Save my info for next time
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>
          Creates a House of Fire account.
        </div>
      </div>
    </button>
  );
}

function Label({ children }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
  }}>{children}</div>;
}
function Input(props) {
  return <input {...props} style={{
    width: '100%', boxSizing: 'border-box', height: 48, padding: '0 14px',
    background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 8,
    fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
    ...(props.style || {}),
  }}/>;
}

// ─── Step 3: payment ───────────────────────────────────────────────────────
function StepPayment({ total }) {
  const [method, setMethod] = React.useState('card');
  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 24, color: HOF.text,
        letterSpacing: '-0.01em',
      }}>Payment</div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 4 }}>
        Secured by Stripe. Apple Pay is fastest.
      </div>

      {/* Apple / Google Pay row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="hof-btn hof-press" onClick={() => setMethod('apple')}
                style={{ flex: 1, height: 52, borderRadius: 10,
                         background: '#000', color: '#fff',
                         border: `1px solid ${HOF.border}`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                         fontFamily: 'Inter', fontSize: 15, fontWeight: 500 }}>
          <Icon name="apple" size={18} color="#fff"/> Pay
        </button>
        <button className="hof-btn hof-press" onClick={() => setMethod('google')}
                style={{ flex: 1, height: 52, borderRadius: 10,
                         background: HOF.elevated, color: HOF.text,
                         border: `1px solid ${HOF.border}`,
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                         fontFamily: 'Inter', fontSize: 15, fontWeight: 500 }}>
          <Icon name="google" size={16} color={HOF.text}/> Pay
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: HOF.border }}/>
        <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
                       textTransform: 'uppercase', letterSpacing: '0.16em' }}>or pay by card</span>
        <div style={{ flex: 1, height: 1, background: HOF.border }}/>
      </div>

      <Label>Card number</Label>
      <div style={{ position: 'relative' }}>
        <Input placeholder="1234 5678 9012 3456" defaultValue="4242 4242 4242 4242"/>
        <div style={{
          position: 'absolute', top: 14, right: 14, display: 'flex', gap: 4,
        }}>
          <div style={{ width: 28, height: 18, borderRadius: 3, background: '#1A1F71' }}/>
          <div style={{ width: 28, height: 18, borderRadius: 3,
                        background: 'linear-gradient(90deg, #EB001B 50%, #F79E1B 50%)' }}/>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <Label>Expiry</Label><Input placeholder="MM / YY" defaultValue="12 / 28"/>
        </div>
        <div style={{ flex: 1 }}>
          <Label>CVC</Label><Input placeholder="CVC" defaultValue="•••"/>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Label>Name on card</Label><Input defaultValue="Sujan Bhuiyan"/>
      </div>
      <div style={{ marginTop: 12 }}>
        <Label>Zip code</Label><Input defaultValue="80302"/>
      </div>

      <div style={{
        marginTop: 18, padding: 14, background: HOF.surface,
        border: `1px solid ${HOF.border}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Icon name="check" size={16} color={HOF.success}/>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, lineHeight: 1.5 }}>
          Tickets are non-refundable but transferable up to 24 hours before doors.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenCheckout });
