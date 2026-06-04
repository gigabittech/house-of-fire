// platform-sheets.jsx — Ticket transfer, refund request, photo upload sheets

// ─── Local sheet mount helper ───────────────────────────────────────────────
function _sheetMount(open) {
  const [mounted, setMounted] = React.useState(open);
  const [shown, setShown]     = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);
  return { mounted, shown };
}

function _SheetShell({ open, onClose, children, title, sub }) {
  const { mounted, shown } = _sheetMount(open);
  if (!mounted) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.55)',
        opacity: shown ? 1 : 0, transition: 'opacity 200ms ease-out',
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90,
        background: HOF.surface, borderTop: `1px solid ${HOF.border}`,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
        boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
        maxHeight: '88%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: HOF.border, margin: '12px auto 6px' }}/>
        <div style={{
          padding: '6px 18px 14px',
          borderBottom: `1px solid ${HOF.border}`,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20,
              color: HOF.text, letterSpacing: '-0.01em',
            }}>{title}</div>
            {sub && <div style={{
              fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
            }}>{sub}</div>}
          </div>
          <button className="hof-btn hof-press" onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 16,
            background: HOF.elevated, border: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="close" size={14} color={HOF.textSec}/>
          </button>
        </div>
        <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 28px' }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Ticket Transfer Sheet ──────────────────────────────────────────────────
function TransferSheet({ open, onClose }) {
  const [stage, setStage] = React.useState('form'); // form | confirm | sent
  const [name, setName]   = React.useState('');
  const [email, setEmail] = React.useState('');
  const [note, setNote]   = React.useState('');

  const valid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  React.useEffect(() => { if (!open) { setStage('form'); setName(''); setEmail(''); setNote(''); } }, [open]);

  return (
    <_SheetShell open={open} onClose={onClose}
                 title="Transfer your ticket"
                 sub="Fireversary · Theme 24 · GA · $28">
      {stage === 'form' && <>
        <PlatformLabel>Who's it going to?</PlatformLabel>
        <PlatformInput value={name} onChange={e => setName(e.target.value)}
                       placeholder="Their full name"/>

        <div style={{ height: 12 }}/>
        <PlatformLabel>Their email</PlatformLabel>
        <PlatformInput value={email} onChange={e => setEmail(e.target.value)}
                       placeholder="friend@example.com" type="email"/>
        <PlatformHelper>They'll get the new ticket here. We'll verify their phone at the door.</PlatformHelper>

        <div style={{ height: 12 }}/>
        <PlatformLabel>Add a note (optional)</PlatformLabel>
        <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Have fun. Don't lose the QR."
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                    background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
                    fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
                    resize: 'vertical', lineHeight: 1.5,
                  }}/>

        <div style={{
          marginTop: 18, padding: 14,
          background: 'rgba(232,162,26,0.08)',
          border: `1px solid rgba(232,162,26,0.3)`, borderRadius: 10,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Icon name="bolt" size={16} color={HOF.warning}/>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.text, lineHeight: 1.5 }}>
            One transfer per ticket. Once they accept, you can't un-transfer. Cutoff is 24h before doors.
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <HofButton variant="primary" full disabled={!valid}
                     onClick={() => setStage('confirm')}>
            {valid ? 'Review & send' : 'Fill in their info'}
          </HofButton>
        </div>
      </>}

      {stage === 'confirm' && <>
        <div style={{
          padding: 16, background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 12,
        }}>
          <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.amber,
                        letterSpacing: '0.18em', textTransform: 'uppercase' }}>You're transferring</div>
          <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                        color: HOF.text, marginTop: 6 }}>Fireversary · GA · Th 24</div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${HOF.border}` }}>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.amber,
                          letterSpacing: '0.18em', textTransform: 'uppercase' }}>To</div>
            <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15,
                          color: HOF.text, marginTop: 6 }}>{name}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12,
                          color: HOF.textSec, marginTop: 2 }}>{email}</div>
          </div>
          {note && <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${HOF.border}` }}>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.amber,
                          letterSpacing: '0.18em', textTransform: 'uppercase' }}>Your note</div>
            <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.text, marginTop: 6,
                          fontStyle: 'italic', lineHeight: 1.5 }}>"{note}"</div>
          </div>}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <HofButton variant="ghost" onClick={() => setStage('form')}>Edit</HofButton>
          <div style={{ flex: 1 }}>
            <HofButton variant="primary" full onClick={() => setStage('sent')}>
              Send transfer
            </HofButton>
          </div>
        </div>
      </>}

      {stage === 'sent' && <>
        <div style={{
          textAlign: 'center', padding: '20px 0 8px',
        }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32,
            background: 'rgba(76,175,110,0.15)', border: `2px solid ${HOF.success}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={32} color={HOF.success}/>
          </div>
          <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: HOF.text }}>
            Transfer sent
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8, lineHeight: 1.5,
                        maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
            {name} has 24 hours to accept. We'll text you when they do — and your ticket disappears from this app.
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <HofButton variant="primary" full onClick={onClose}>Done</HofButton>
        </div>
      </>}
    </_SheetShell>
  );
}

// ─── Refund Request Sheet ───────────────────────────────────────────────────
function RefundSheet({ open, onClose }) {
  const [reason, setReason] = React.useState('');
  const [detail, setDetail] = React.useState('');
  const [stage, setStage]   = React.useState('form');

  React.useEffect(() => { if (!open) { setStage('form'); setReason(''); setDetail(''); } }, [open]);

  const reasons = [
    ['emergency', 'Emergency / illness',   'We make exceptions for real ones.'],
    ['travel',    'Travel fell through',   "Bummer — let's see what we can do."],
    ['mistake',   'Bought by mistake',     'No problem if it\'s within 24h.'],
    ['other',     'Something else',        'Tell us in your note.'],
  ];

  return (
    <_SheetShell open={open} onClose={onClose}
                 title="Refund request"
                 sub="Tickets are non-refundable, but we read every request.">
      {stage === 'form' && <>
        <PlatformLabel>What happened?</PlatformLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reasons.map(([k, t, s]) => (
            <button key={k} className="hof-btn hof-press" onClick={() => setReason(k)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '12px 14px',
                      background: reason === k ? HOF.elevated : HOF.bg,
                      border: reason === k ? `2px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
                      borderRadius: 10,
                    }}>
              <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{t}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>{s}</div>
            </button>
          ))}
        </div>

        <div style={{ height: 14 }}/>
        <PlatformLabel>Anything else we should know?</PlatformLabel>
        <textarea value={detail} onChange={e => setDetail(e.target.value)}
                  placeholder="A sentence is plenty."
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                    background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
                    fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
                    resize: 'vertical', lineHeight: 1.5,
                  }}/>

        <div style={{
          marginTop: 18, padding: 14,
          background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 10,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, lineHeight: 1.5,
          }}>
            Faster path: <span style={{ color: HOF.amber }}>transfer your ticket</span> to a friend. They get to come, you get your money — no waiting on us.
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <HofButton variant="primary" full disabled={!reason}
                     onClick={() => setStage('sent')}>
            {reason ? 'Send request' : 'Pick a reason'}
          </HofButton>
        </div>
      </>}

      {stage === 'sent' && <>
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32,
            background: HOF.elevated, border: `2px solid ${HOF.amber}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="bell" size={28} color={HOF.amber}/>
          </div>
          <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: HOF.text }}>
            Request submitted
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8, lineHeight: 1.5,
                        maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Jordan reviews refund requests personally. You'll hear back within 2 business days, usually same day during theme weeks.
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <HofButton variant="primary" full onClick={onClose}>Done</HofButton>
        </div>
      </>}
    </_SheetShell>
  );
}

// ─── Photo Submission Sheet ─────────────────────────────────────────────────
function PhotoSubmitSheet({ open, onClose, edition = 23 }) {
  const [photos, setPhotos] = React.useState([0, 1]);
  const [caption, setCaption] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [stage, setStage]     = React.useState('form');

  React.useEffect(() => { if (!open) { setStage('form'); setCaption(''); setConsent(false); setPhotos([0, 1]); } }, [open]);

  const valid = photos.length > 0 && consent;

  return (
    <_SheetShell open={open} onClose={onClose}
                 title={`Submit photos · Theme ${edition}`}
                 sub="Crew reviews and posts the best to the recap.">
      {stage === 'form' && <>
        <PlatformLabel>Your photos ({photos.length})</PlatformLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
        }}>
          {photos.map((s, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden' }}>
              <HofPhoto seed={s} gradient={false} style={{ width: '100%', height: '100%' }}/>
              <button className="hof-btn hof-press"
                      onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 22, height: 22, borderRadius: 11,
                        background: 'rgba(10,10,8,0.8)', backdropFilter: 'blur(6px)',
                        border: `1px solid ${HOF.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                <Icon name="close" size={10} color={HOF.text}/>
              </button>
            </div>
          ))}
          {/* Add slot */}
          <button className="hof-btn hof-press"
                  onClick={() => photos.length < 8 && setPhotos(p => [...p, (p.length) % 4])}
                  style={{
                    aspectRatio: '1/1', borderRadius: 8,
                    background: HOF.bg, border: `1px dashed ${HOF.border}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
            <Icon name="plus" size={20} color={HOF.textSec}/>
            <span style={{ fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
                           letterSpacing: '0.16em', textTransform: 'uppercase' }}>Add</span>
          </button>
        </div>
        <PlatformHelper>Up to 8 per submission. JPG / HEIC / PNG. Faces of strangers will be blurred unless they're members who opted in.</PlatformHelper>

        <div style={{ height: 14 }}/>
        <PlatformLabel>Caption (optional)</PlatformLabel>
        <PlatformInput value={caption} onChange={e => setCaption(e.target.value)}
                       placeholder="e.g. peak moment, second drop"/>

        {/* Consent */}
        <button className="hof-btn hof-press" onClick={() => setConsent(!consent)}
                style={{
                  width: '100%', marginTop: 18, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  background: consent ? HOF.elevated : HOF.bg,
                  border: consent ? `1px solid ${HOF.amber}` : `1px solid ${HOF.border}`,
                  borderRadius: 10,
                }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5, flexShrink: 0,
            background: consent ? HOF.amber : 'transparent',
            border: `1.5px solid ${consent ? HOF.amber : HOF.borderHi}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {consent && <Icon name="check" size={12} color={HOF.bg}/>}
          </div>
          <div style={{ flex: 1, fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.45 }}>
            I took these or have permission to share them. Approved photos may appear in the recap and on the home archive.
          </div>
        </button>

        <div style={{ marginTop: 18 }}>
          <HofButton variant="primary" full disabled={!valid} onClick={() => setStage('sent')}>
            {valid ? `Submit ${photos.length} photo${photos.length === 1 ? '' : 's'}` : 'Confirm consent'}
          </HofButton>
        </div>
      </>}

      {stage === 'sent' && <>
        <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px', borderRadius: 32,
            background: 'rgba(76,175,110,0.15)', border: `2px solid ${HOF.success}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="camera" size={28} color={HOF.success}/>
          </div>
          <div style={{ fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22, color: HOF.text }}>
            In the review queue
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8, lineHeight: 1.5,
                        maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
            Crew reviews within a couple days. We'll notify you when they're up.
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <HofButton variant="primary" full onClick={onClose}>Done</HofButton>
        </div>
      </>}
    </_SheetShell>
  );
}

// ─── Form atoms ─────────────────────────────────────────────────────────────
function PlatformLabel({ children }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
    letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
  }}>{children}</div>;
}
function PlatformInput(props) {
  return <input {...props} style={{
    width: '100%', boxSizing: 'border-box', height: 46, padding: '0 14px',
    background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 8,
    fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
    ...(props.style || {}),
  }}/>;
}
function PlatformHelper({ children }) {
  return <div style={{
    fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 8, lineHeight: 1.45,
  }}>{children}</div>;
}

Object.assign(window, { TransferSheet, RefundSheet, PhotoSubmitSheet });
