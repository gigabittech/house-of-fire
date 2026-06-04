// screen-door.jsx — Door Management (admin desktop + bouncer mobile).
// Adds walk-up ticket sales alongside the QR scanner.

// ─── Sell at the door modal ─────────────────────────────────────────────────
function SellAtDoorModal({ open, onClose, mobile = false, onSold }) {
  const [tier, setTier]       = React.useState('ga');
  const [qty, setQty]         = React.useState(1);
  const [first, setFirst]     = React.useState('');
  const [last, setLast]       = React.useState('');
  const [email, setEmail]     = React.useState('');
  const [phone, setPhone]     = React.useState('');
  const [pay, setPay]         = React.useState('tap');
  const [stage, setStage]     = React.useState('form'); // form | processing | done

  const tierData = {
    ga:  { name: 'General', price: 28 },
    vip: { name: 'VIP',     price: 55 },
  };
  const total = tierData[tier].price * qty;
  const valid = first.trim() && last.trim()
             && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
             && phone.replace(/\D/g, '').length >= 10;

  if (!open) return null;

  function submit() {
    setStage('processing');
    setTimeout(() => {
      setStage('done');
      setTimeout(() => {
        onSold && onSold({ first, last, email, phone, tier, qty, pay, total });
        // reset
        setStage('form'); setFirst(''); setLast(''); setEmail(''); setPhone('');
        setTier('ga'); setQty(1); setPay('tap');
        onClose();
      }, 1100);
    }, 1100);
  }

  const cardWidth = mobile ? '100%' : 520;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: mobile ? 0 : 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           style={{
             width: cardWidth, maxHeight: mobile ? '88%' : '92%',
             overflowY: 'auto',
             background: HOF.surface,
             border: `1px solid ${HOF.border}`,
             borderRadius: mobile ? '22px 22px 0 0' : 14,
             color: HOF.text, fontFamily: 'Inter',
             display: 'flex', flexDirection: 'column',
           }}
           className="hof-scroll">
        {mobile && (
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: HOF.border, margin: '12px auto 4px',
          }}/>
        )}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: `1px solid ${HOF.border}`,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Walk-up sale</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
              color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
            }}>Sell at the door</div>
          </div>
          <button className="hof-btn hof-press" onClick={onClose}
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: HOF.elevated, border: `1px solid ${HOF.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
            <Icon name="close" size={14} color={HOF.textSec}/>
          </button>
        </div>

        {stage === 'processing' && (
          <Processing total={total}/>
        )}
        {stage === 'done' && (
          <Done first={first}/>
        )}
        {stage === 'form' && (
          <div style={{ padding: 22 }}>
            {/* Tier */}
            <DoorLabel>Tier</DoorLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(tierData).map(([id, t]) => (
                <button key={id} className="hof-btn hof-press"
                        onClick={() => setTier(id)}
                        style={{
                          flex: 1, padding: '12px 14px', textAlign: 'left',
                          background: tier === id ? HOF.elevated : HOF.bg,
                          border: tier === id ? `2px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
                          borderRadius: 10,
                        }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{t.name}</span>
                    <span style={{
                      fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18, color: HOF.text,
                    }}>${t.price}</span>
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2 }}>
                    {id === 'vip' ? '10 left at door' : '37 left at door'}
                  </div>
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div style={{
              marginTop: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: HOF.bg,
              border: `1px solid ${HOF.border}`, borderRadius: 10,
            }}>
              <div>
                <DoorLabel inline>Quantity</DoorLabel>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec }}>Max 4 per buyer</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button className="hof-btn hof-press" onClick={() => setQty(Math.max(1, qty - 1))}
                        style={{ width: 32, height: 32, borderRadius: 16,
                                 background: HOF.elevated, border: `1px solid ${HOF.border}`,
                                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="minus" size={14} color={qty === 1 ? HOF.textDis : HOF.text}/>
                </button>
                <span style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                  color: HOF.text, width: 22, textAlign: 'center',
                }}>{qty}</span>
                <button className="hof-btn hof-press" onClick={() => setQty(Math.min(4, qty + 1))}
                        style={{ width: 32, height: 32, borderRadius: 16,
                                 background: HOF.amber,
                                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={14} color={HOF.bg}/>
                </button>
              </div>
            </div>

            {/* Buyer details */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <div style={{ flex: 1 }}>
                <DoorLabel>First name</DoorLabel>
                <DoorInput value={first} onChange={e => setFirst(e.target.value)} placeholder="First"/>
              </div>
              <div style={{ flex: 1 }}>
                <DoorLabel>Last name</DoorLabel>
                <DoorInput value={last} onChange={e => setLast(e.target.value)} placeholder="Last"/>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <DoorLabel>Email (for ticket receipt)</DoorLabel>
              <DoorInput value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="buyer@example.com" type="email"/>
            </div>
            <div style={{ marginTop: 12 }}>
              <DoorLabel>Phone</DoorLabel>
              <DoorInput value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                         placeholder="(555) 123-4567" type="tel"/>
            </div>

            {/* Payment */}
            <DoorLabel style={{ marginTop: 18 }}>Payment</DoorLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <PayChoice id="tap" pay={pay} setPay={setPay}
                         icon="wallet" title="Tap to Pay" sub="Apple / Google"/>
              <PayChoice id="card" pay={pay} setPay={setPay}
                         icon="ticket" title="Card reader" sub="Insert / tap"/>
              <PayChoice id="cash" pay={pay} setPay={setPay}
                         icon="bolt" title="Cash" sub="Log to register"/>
            </div>

            {/* Total + submit */}
            <div style={{
              marginTop: 22, padding: '16px 18px',
              background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 12,
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec,
                             textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                Total · {qty} {qty === 1 ? 'ticket' : 'tickets'}
              </span>
              <span style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26,
                color: HOF.text, letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}>${total.toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <HofButton variant="primary" full disabled={!valid} onClick={submit}
                         icon={<Icon name="check" size={16} color={HOF.bg}/>}>
                {valid ? `Charge $${total.toFixed(2)}` : 'Fill in buyer details'}
              </HofButton>
            </div>
            <div style={{
              marginTop: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
            }}>
              <Icon name="check" size={11} color={HOF.success}/>
              Encrypted via Stripe Terminal · ticket emailed instantly
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPhone(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

function Processing({ total }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32,
        background: HOF.elevated, border: `2px solid ${HOF.amber}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'hof-glow 1.4s ease-in-out infinite',
      }}>
        <Icon name="wallet" size={26} color={HOF.amber}/>
      </div>
      <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20, color: HOF.text }}>
        Charging ${total.toFixed(2)}…
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 6 }}>
        Awaiting tap. Hold the card or phone near the reader.
      </div>
    </div>
  );
}

function Done({ first }) {
  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32,
        background: 'rgba(76,175,110,0.15)',
        border: `2px solid ${HOF.success}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check" size={32} color={HOF.success}/>
      </div>
      <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20, color: HOF.text }}>
        Approved
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 6 }}>
        Ticket sent to {first || 'buyer'}. Wave them in.
      </div>
    </div>
  );
}

function DoorLabel({ children, style = {}, inline = false }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
    letterSpacing: '0.18em', textTransform: 'uppercase',
    marginBottom: inline ? 0 : 8, ...style,
  }}>{children}</div>;
}
function DoorInput(props) {
  return <input {...props} style={{
    width: '100%', boxSizing: 'border-box', height: 42, padding: '0 12px',
    background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
    fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
    ...(props.style || {}),
  }}/>;
}
function PayChoice({ id, pay, setPay, icon, title, sub }) {
  const active = pay === id;
  return (
    <button className="hof-btn hof-press" onClick={() => setPay(id)}
            style={{
              padding: '12px 12px', textAlign: 'left',
              background: active ? HOF.elevated : HOF.bg,
              border: active ? `2px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
              borderRadius: 10,
            }}>
      <Icon name={icon} size={18} color={active ? HOF.amber : HOF.text}/>
      <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text, marginTop: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2 }}>
        {sub}
      </div>
    </button>
  );
}

// ─── Scanner Viewfinder (shared) ────────────────────────────────────────────
function ScannerView({ height = '100%' }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height,
      background: '#050503', overflow: 'hidden', borderRadius: 12,
    }}>
      {/* Atmospheric camera feed */}
      <PhotoPlaceholder seed={3} kind="crowd" style={{
        position: 'absolute', inset: 0, opacity: 0.55,
      }}/>

      {/* Center reticle */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 260, height: 260,
      }}>
        {/* Four corner brackets */}
        {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v, h]) => (
          <div key={`${v}-${h}`} style={{
            position: 'absolute', [v]: 0, [h]: 0,
            width: 36, height: 36,
            borderTop:    v === 'top'    ? `3px solid ${HOF.amber}` : 'none',
            borderBottom: v === 'bottom' ? `3px solid ${HOF.amber}` : 'none',
            borderLeft:   h === 'left'   ? `3px solid ${HOF.amber}` : 'none',
            borderRight:  h === 'right'  ? `3px solid ${HOF.amber}` : 'none',
            borderRadius: 6,
          }}/>
        ))}
        {/* Scanline */}
        <div style={{
          position: 'absolute', left: 6, right: 6, top: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${HOF.amber}, transparent)`,
          boxShadow: `0 0 12px ${HOF.amber}`,
          animation: 'hof-scanline 1.8s ease-in-out infinite',
        }}/>
      </div>

      {/* Active pill */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderRadius: 4,
        background: 'rgba(20,20,18,0.7)', backdropFilter: 'blur(8px)',
        border: `1px solid ${HOF.border}`,
        fontFamily: 'Inter', fontSize: 10, color: HOF.success,
        letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 3, background: HOF.success,
          animation: 'hof-pulse 1.4s ease-in-out infinite',
        }}/>
        Scanner live
      </div>

      {/* Caption */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 16,
        padding: '12px 14px', borderRadius: 10,
        background: 'rgba(20,20,18,0.78)', backdropFilter: 'blur(10px)',
        border: `1px solid ${HOF.border}`,
        fontFamily: 'Inter', fontSize: 12, color: HOF.text, textAlign: 'center',
      }}>
        Hold a ticket QR up to scan — or sell at the door below.
      </div>
    </div>
  );
}

// ─── Desktop Door View (lives inside admin main pane) ───────────────────────
function DoorDesktopView({ defaultModalOpen = false }) {
  const [modalOpen, setModalOpen] = React.useState(defaultModalOpen);

  return (
    <div style={{ padding: '20px 28px 28px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16,
      }}>
        {/* Scanner side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ScannerView height={420}/>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
          }}>
            <DoorStat label="Sold" value="253" sub="online"/>
            <DoorStat label="Scanned" value="187" sub="74% in" tone="amber"/>
            <DoorStat label="Walk-ups" value="14" sub="$392 cash + card"/>
            <DoorStat label="Remaining" value="47" sub="capacity left"/>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Big sell button card */}
          <div style={{
            padding: 20,
            background: `linear-gradient(155deg, rgba(232,101,26,0.16) 0%, ${HOF.surface} 60%)`,
            border: `1px solid ${HOF.border}`,
            borderRadius: 12,
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Walk-up sales</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 24,
              color: HOF.text, letterSpacing: '-0.01em', marginTop: 6,
              lineHeight: 1.2,
            }}>
              Friend showed up<br/>without a ticket?
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8 }}>
              Capture their details, charge a card, add them to the guest list — in under a minute.
            </div>
            <div style={{ marginTop: 16 }}>
              <HofButton variant="primary" full size="lg"
                         onClick={() => setModalOpen(true)}
                         icon={<Icon name="plus" size={16} color={HOF.bg}/>}>
                Sell at the door
              </HofButton>
            </div>
          </div>

          {/* Activity feed */}
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            padding: '16px 18px',
            flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12,
            }}>Live activity</div>
            <div className="hof-scroll" style={{
              flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {ACTIVITY.map((a, i) => <ActivityRow key={i} a={a}/>)}
            </div>
          </div>
        </div>
      </div>

      <SellAtDoorModal open={modalOpen} onClose={() => setModalOpen(false)}/>
    </div>
  );
}

const ACTIVITY = [
  { t: '10:42', name: 'Walk-up · M. Castellanos', meta: 'GA · Tap to Pay · $28', tone: 'amber',   kind: 'sale' },
  { t: '10:41', name: 'Sujan Bhuiyan',            meta: 'VIP · scanned in',       tone: 'success', kind: 'scan' },
  { t: '10:40', name: 'Devon Park · +1',          meta: 'GA · scanned in',        tone: 'success', kind: 'scan' },
  { t: '10:38', name: 'Walk-up · K. Stone',       meta: 'GA · Card · $28',        tone: 'amber',   kind: 'sale' },
  { t: '10:37', name: 'Tara Reyes',               meta: 'VIP · scanned in',       tone: 'success', kind: 'scan' },
  { t: '10:36', name: 'Iris Wong',                meta: 'GA · scanned in',        tone: 'success', kind: 'scan' },
  { t: '10:34', name: 'Walk-up · J. Lee · ×2',    meta: 'GA · Cash · $56',        tone: 'amber',   kind: 'sale' },
  { t: '10:32', name: 'Andrés Reyes',             meta: 'GA · scanned in',        tone: 'success', kind: 'scan' },
  { t: '10:30', name: 'Doors opened',             meta: 'Scanner armed',          tone: 'neutral', kind: 'system' },
];

function ActivityRow({ a }) {
  const c = a.tone === 'amber' ? HOF.amber : a.tone === 'success' ? HOF.success : HOF.textSec;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '50px 22px 1fr',
      gap: 10, padding: '9px 4px', alignItems: 'center',
      borderBottom: `1px solid ${HOF.border}`,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec,
        fontVariantNumeric: 'tabular-nums',
      }}>{a.t}</span>
      <span style={{
        width: 22, height: 22, borderRadius: 11,
        background: a.tone === 'amber'   ? 'rgba(232,101,26,0.16)'
                  : a.tone === 'success' ? 'rgba(76,175,110,0.16)'
                  : HOF.elevated,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={a.kind === 'sale' ? 'plus' : a.kind === 'scan' ? 'check' : 'bolt'}
              size={11} color={c}/>
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.name}
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>
          {a.meta}
        </div>
      </div>
    </div>
  );
}

function DoorStat({ label, value, sub, tone }) {
  const c = tone === 'amber' ? HOF.amber : HOF.text;
  return (
    <div style={{
      background: HOF.surface, border: `1px solid ${HOF.border}`,
      borderRadius: 10, padding: '12px 14px',
    }}>
      <div style={{
        fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
        color: c, marginTop: 4, letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

// ─── Mobile Bouncer View (for use inside iOS phone frame) ──────────────────
function ScreenDoorMobile({ nav }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <HofScreen>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: 'rgba(10,10,8,0.85)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${HOF.border}`,
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Door · Th. 24</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 16,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 2,
          }}>Fireversary</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 9px', borderRadius: 4,
            background: 'rgba(76,175,110,0.12)',
            border: `1px solid rgba(76,175,110,0.35)`,
            fontFamily: 'Inter', fontSize: 10, color: HOF.success,
            letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: 3, background: HOF.success,
              animation: 'hof-pulse 1.4s ease-in-out infinite',
            }}/>
            Live
          </span>
        </div>
      </div>

      <HofScroll>
        <div style={{ height: 110 }}/>

        {/* Big scanner */}
        <div style={{ padding: '0 12px' }}>
          <div style={{ height: 360, position: 'relative' }}>
            <ScannerView/>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          padding: '14px 16px 0',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
        }}>
          {[
            ['Sold', '253', HOF.text],
            ['In',   '187', HOF.success],
            ['Walk', '14',  HOF.amber],
            ['Left', '47',  HOF.text],
          ].map(([l, v, c]) => (
            <div key={l} style={{
              background: HOF.surface, border: `1px solid ${HOF.border}`,
              borderRadius: 8, padding: '8px 6px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                color: c, fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
              }}>{v}</div>
              <div style={{
                fontFamily: 'Inter', fontSize: 9, color: HOF.textSec,
                textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 2,
              }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Walk-up CTA */}
        <div style={{ padding: '16px' }}>
          <HofButton variant="primary" full
                     onClick={() => setModalOpen(true)}
                     icon={<Icon name="plus" size={18} color={HOF.bg}/>}>
            Sell at the door
          </HofButton>
          <div style={{
            marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
          }}>
            <Icon name="check" size={11} color={HOF.success}/>
            Tap to Pay, card reader, or cash — Stripe Terminal.
          </div>
        </div>

        {/* Activity (compact) */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8,
          }}>Recent</div>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
            padding: '4px 12px',
          }}>
            {ACTIVITY.slice(0, 5).map((a, i) => <ActivityRow key={i} a={a}/>)}
          </div>
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      <SellAtDoorModal open={modalOpen} onClose={() => setModalOpen(false)} mobile/>
    </HofScreen>
  );
}

Object.assign(window, {
  DoorDesktopView, ScreenDoorMobile, SellAtDoorModal,
});
