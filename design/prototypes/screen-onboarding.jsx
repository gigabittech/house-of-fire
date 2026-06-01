// screen-onboarding.jsx — Sign-up + channel picker + welcome
// 3 sequential steps, each its own artboard-friendly state.

function ScreenOnboarding({ startStep = 1, onComplete, onSignIn }) {
  const [step, setStep] = React.useState(startStep);
  const [data, setData] = React.useState({
    first: '', last: '', email: '', phone: '',
    displayName: '', channels: ['general', 'lineup'],
  });
  const setField = (k, v) => setData(d => ({ ...d, [k]: v }));

  // step 1: account, step 2: channels, step 3: welcome
  return (
    <HofScreen>
      <HofScroll>
        <div style={{ height: 54 }}/>

        {/* Progress dots */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '14px 0 0',
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i <= step ? HOF.amber : HOF.elevated,
              transition: 'width 200ms',
            }}/>
          ))}
        </div>

        {step === 1 && <StepSignup data={data} setField={setField}
                                   onSignIn={onSignIn}
                                   onNext={() => setStep(2)}/>}
        {step === 2 && <StepChannels data={data} setField={setField}
                                     onBack={() => setStep(1)}
                                     onNext={() => setStep(3)}/>}
        {step === 3 && <StepWelcome data={data} onComplete={onComplete}/>}

        <HofHomeSpacer/>
      </HofScroll>
    </HofScreen>
  );
}

function StepSignup({ data, setField, onSignIn, onNext }) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneOk = data.phone.replace(/\D/g, '').length >= 10;
  const valid = data.first.trim() && data.last.trim() && emailOk && phoneOk;

  return (
    <div style={{ padding: '24px 20px' }}>
      <HofLogoMark size={36}/>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 700, fontSize: 32,
        color: HOF.text, marginTop: 18, letterSpacing: '-0.02em',
        lineHeight: 1.05, textTransform: 'uppercase',
      }}>
        Let's get you in.
      </div>
      <div style={{
        fontFamily: 'Inter', fontSize: 14, color: HOF.textSec,
        marginTop: 8, lineHeight: 1.5, textWrap: 'pretty',
      }}>
        Members get first crack at tickets, photos, and the discussion board.
      </div>

      {/* Apple SSO */}
      <div style={{ marginTop: 22 }}>
        <HofButton variant="quiet" full size="lg"
                   icon={<Icon name="apple" size={18} color={HOF.text}/>}>
          Continue with Apple
        </HofButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
        <div style={{ flex: 1, height: 1, background: HOF.border }}/>
        <span style={{
          fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
          textTransform: 'uppercase', letterSpacing: '0.16em',
        }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: HOF.border }}/>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <OnboardLabel>First name</OnboardLabel>
          <OnboardInput value={data.first} onChange={e => setField('first', e.target.value)}
                        placeholder="First" autoComplete="given-name"/>
        </div>
        <div style={{ flex: 1 }}>
          <OnboardLabel>Last name</OnboardLabel>
          <OnboardInput value={data.last} onChange={e => setField('last', e.target.value)}
                        placeholder="Last" autoComplete="family-name"/>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <OnboardLabel>Email</OnboardLabel>
        <OnboardInput value={data.email} onChange={e => setField('email', e.target.value)}
                      placeholder="you@example.com" type="email"/>
      </div>
      <div style={{ marginTop: 14 }}>
        <OnboardLabel>Phone</OnboardLabel>
        <PhoneRow value={data.phone}
                  onChange={v => setField('phone', formatPhoneFn(v))}/>
        <div style={{
          fontFamily: 'Inter', fontSize: 12, color: HOF.textSec,
          marginTop: 8, lineHeight: 1.45,
        }}>
          We text once when tickets drop, and once on the day-of. Nothing else.
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <HofButton variant="primary" full disabled={!valid} onClick={onNext}>
          {valid ? 'Continue' : 'Fill in your details'}
        </HofButton>
      </div>

      <div style={{
        textAlign: 'center', marginTop: 16,
        fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
      }}>
        Already a member?{' '}
        <button className="hof-btn" onClick={onSignIn}
                style={{ color: HOF.amber, fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
          Sign in →
        </button>
      </div>

      <div style={{
        marginTop: 28, textAlign: 'center',
        fontFamily: 'Inter', fontSize: 11, color: HOF.textDis, lineHeight: 1.6,
      }}>
        By continuing you agree to our Terms and Privacy. We don't sell data, ever.
      </div>
    </div>
  );
}

function StepChannels({ data, setField, onBack, onNext }) {
  const toggle = (id) => {
    const has = data.channels.includes(id);
    setField('channels', has ? data.channels.filter(c => c !== id) : [...data.channels, id]);
  };

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 700, fontSize: 32,
        color: HOF.text, letterSpacing: '-0.02em',
        lineHeight: 1.05, textTransform: 'uppercase',
      }}>
        What do you want<br/>to follow?
      </div>
      <div style={{
        fontFamily: 'Inter', fontSize: 14, color: HOF.textSec,
        marginTop: 10, lineHeight: 1.5,
      }}>
        Pick the channels that should land on your home feed. Change this anytime.
      </div>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CHANNELS.filter(c => !c.locked).map(c => {
          const on = data.channels.includes(c.id);
          return (
            <button key={c.id} className="hof-btn hof-press" onClick={() => toggle(c.id)}
                    style={{
                      width: '100%', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      background: on ? HOF.elevated : HOF.surface,
                      border: on ? `2px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
                      borderRadius: 12,
                    }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'JetBrains Mono', fontSize: 14, color: on ? HOF.amber : HOF.text,
                  fontWeight: 500, letterSpacing: '0.02em',
                }}>#{c.name}</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
                }}>{c.desc}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: on ? HOF.amber : 'transparent',
                border: `1.5px solid ${on ? HOF.amber : HOF.borderHi}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {on && <Icon name="check" size={14} color={HOF.bg}/>}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <HofButton variant="ghost" onClick={onBack} icon={<Icon name="arrowL" size={14} color={HOF.text}/>}>
          Back
        </HofButton>
        <div style={{ flex: 1 }}>
          <HofButton variant="primary" full onClick={onNext}>
            {data.channels.length ? `Follow ${data.channels.length} channel${data.channels.length === 1 ? '' : 's'}` : 'Skip for now'}
          </HofButton>
        </div>
      </div>
    </div>
  );
}

function StepWelcome({ data, onComplete }) {
  return (
    <div style={{ padding: '40px 20px 24px', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 40, margin: '0 auto',
        background: `linear-gradient(135deg, ${HOF.amber}, ${HOF.ember})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'hof-glow 2s ease-in-out infinite',
      }}>
        <Icon name="flame" size={40} color={HOF.bg}/>
      </div>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 700, fontSize: 36,
        color: HOF.text, marginTop: 22, letterSpacing: '-0.02em',
        lineHeight: 1, textTransform: 'uppercase',
      }}>
        You're in.
      </div>
      <div style={{
        fontFamily: 'Inter', fontSize: 15, color: HOF.textSec,
        marginTop: 12, lineHeight: 1.55, textWrap: 'pretty',
        maxWidth: 300, marginLeft: 'auto', marginRight: 'auto',
      }}>
        Welcome, {data.first || 'friend'}. The next edition is Fri Jun 26 — tickets close when we hit 300. Lock yours in.
      </div>

      <div style={{ marginTop: 32, padding: '0 4px' }}>
        <HofButton variant="primary" full onClick={onComplete}
                   icon={<Icon name="ticket" size={18} color={HOF.bg}/>}>
          Get Edition 24 tickets
        </HofButton>
        <div style={{ height: 10 }}/>
        <HofButton variant="ghost" full onClick={onComplete}>
          Just look around first
        </HofButton>
      </div>

      <div style={{
        marginTop: 28, padding: 16,
        background: HOF.surface, border: `1px solid ${HOF.border}`,
        borderRadius: 12,
      }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 11, color: HOF.amber,
          letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8,
        }}>What's next</div>
        <div style={{
          fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.5, textAlign: 'left',
        }}>
          We just sent a verification link to <span style={{ fontWeight: 500 }}>{data.email || 'your email'}</span>. Click it to confirm — or keep going, you can verify later.
        </div>
      </div>
    </div>
  );
}

// ─── Local atoms ────────────────────────────────────────────────────────────
function OnboardLabel({ children }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
  }}>{children}</div>;
}
function OnboardInput(props) {
  return <input {...props} style={{
    width: '100%', boxSizing: 'border-box', height: 48, padding: '0 14px',
    background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 8,
    fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
    ...(props.style || {}),
  }}/>;
}
function PhoneRow({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: HOF.surface, borderRadius: 8,
      border: `1px solid ${HOF.border}`, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 12px 0 14px',
        background: HOF.elevated, color: HOF.textSec,
        fontFamily: 'JetBrains Mono', fontSize: 13,
        borderRight: `1px solid ${HOF.border}`,
        letterSpacing: '0.04em',
      }}>+1</div>
      <input value={value} onChange={e => onChange(e.target.value)}
             placeholder="(555) 123-4567" type="tel" inputMode="tel"
             style={{
               flex: 1, height: 48, padding: '0 14px', background: 'transparent',
               border: 0, outline: 'none',
               fontFamily: 'Inter', fontSize: 14, color: HOF.text,
               fontVariantNumeric: 'tabular-nums',
             }}/>
    </div>
  );
}
function formatPhoneFn(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

Object.assign(window, { ScreenOnboarding });
