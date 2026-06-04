// screen-ticket.jsx — Post-purchase confirmation + QR

function ScreenTicket({ nav, onBack, startTransferOpen = false, startRefundOpen = false }) {
  const [transferOpen, setTransferOpen] = React.useState(startTransferOpen);
  const [refundOpen, setRefundOpen]     = React.useState(startRefundOpen);
  return (
    <HofScreen>
      <HofTopBar title="Your Ticket" onBack={onBack}
                 right={<Icon name="share" size={20} color={HOF.text}/>}/>

      <HofScroll>
        <div style={{ height: 102 }}/>

        {/* Day-of contextual banner */}
        <div style={{
          margin: '0 16px 16px', padding: '12px 14px',
          background: 'rgba(232,101,26,0.1)', border: `1px solid rgba(232,101,26,0.3)`,
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 13,
            background: HOF.amber, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="flame" size={14} color={HOF.bg}/>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text }}>
              Tonight's the night.
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, marginTop: 1 }}>
              Doors open at 8 PM. Side entrance on 23rd.
            </div>
          </div>
        </div>

        {/* Success copy */}
        <div style={{ padding: '12px 16px 18px' }}>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 700, fontSize: 40,
            color: HOF.text, letterSpacing: '-0.02em', lineHeight: 1,
          }}>You're in.</div>
          <div style={{
            fontFamily: 'Inter', fontSize: 14, color: HOF.textSec, marginTop: 8,
            lineHeight: 1.5, textWrap: 'pretty',
          }}>
            See you Friday. The QR below is your ticket — open this screen at the door.
          </div>
        </div>

        {/* Ticket card */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: HOF.text, borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(232,101,26,0.15), 0 0 0 1px rgba(240,237,230,0.1)',
            position: 'relative',
          }}>
            {/* Top stub */}
            <div style={{
              padding: '20px 20px 16px', position: 'relative',
              background: HOF.text,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 10, color: HOF.bg,
                    letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.5,
                  }}>Theme 24 · Admit one</div>
                  <img src="assets/hof-logo-black.png" alt="House of Fire" style={{
                    height: 30, width: 'auto', display: 'block', marginTop: 8, marginLeft: -3,
                  }}/>
                  <div style={{
                    fontFamily: 'Clash Display', fontWeight: 600, fontSize: 16,
                    color: HOF.bg, marginTop: 6, lineHeight: 1, letterSpacing: '0',
                    textTransform: 'uppercase',
                  }}>Fireversary</div>
                </div>
                <div style={{
                  padding: '4px 8px', background: HOF.amber, color: HOF.bg,
                  fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 4,
                }}>GA</div>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18,
              }}>
                {[
                  ['Date',  'Fri · Jun 26 · 2026'],
                  ['Doors', '8:00 PM'],
                  ['Venue', 'Junkyard Social Club'],
                  ['Holder','Sujan Bhuiyan'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{
                      fontFamily: 'Inter', fontSize: 9, color: HOF.bg, opacity: 0.5,
                      letterSpacing: '0.16em', textTransform: 'uppercase',
                    }}>{k}</div>
                    <div style={{
                      fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.bg, marginTop: 2,
                    }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perforation */}
            <div style={{ position: 'relative', height: 18 }}>
              <div style={{
                position: 'absolute', left: -10, top: '50%', width: 20, height: 20,
                background: HOF.bg, borderRadius: 10, transform: 'translateY(-50%)',
              }}/>
              <div style={{
                position: 'absolute', right: -10, top: '50%', width: 20, height: 20,
                background: HOF.bg, borderRadius: 10, transform: 'translateY(-50%)',
              }}/>
              <div style={{
                position: 'absolute', left: 16, right: 16, top: '50%',
                borderTop: `1.5px dashed rgba(10,10,8,0.2)`,
              }}/>
            </div>

            {/* QR area */}
            <div style={{
              padding: '6px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <FakeQR size={230} fg={HOF.bg} bg={HOF.text}/>
              <div style={{
                marginTop: 14, fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.bg,
                letterSpacing: '0.16em', fontWeight: 500,
              }}>HOF—24—4218</div>
              <div style={{
                marginTop: 4, fontFamily: 'Inter', fontSize: 11, color: HOF.bg, opacity: 0.5,
              }}>Show at the door · keep brightness up</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '20px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          <HofButton variant="quiet" size="md" icon={<Icon name="wallet" size={16} color={HOF.text}/>}>
            Add to Wallet
          </HofButton>
          <HofButton variant="quiet" size="md" icon={<Icon name="download" size={16} color={HOF.text}/>}>
            Save PDF
          </HofButton>
          <HofButton variant="quiet" size="md" onClick={() => setTransferOpen(true)}
                     icon={<Icon name="share" size={16} color={HOF.text}/>}>
            Transfer
          </HofButton>
          <HofButton variant="quiet" size="md" onClick={() => setRefundOpen(true)}
                     icon={<Icon name="bolt" size={16} color={HOF.text}/>}>
            Request refund
          </HofButton>
        </div>

        {/* Tell a friend */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Icon name="flame" size={16} color={HOF.amber}/>
              <div style={{
                fontFamily: 'Clash Display', fontWeight: 600, fontSize: 16, color: HOF.text,
              }}>Tell a friend</div>
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginBottom: 12 }}>
              35 tickets left at General. The room fills up by the weekend.
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: HOF.bg, border: `1px solid ${HOF.border}`,
              borderRadius: 8,
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: 12, color: HOF.textSec,
              }}>houseoffire.events/e/24</span>
              <span style={{
                fontFamily: 'Inter', fontSize: 12, color: HOF.amber, fontWeight: 500,
              }}>Copy</span>
            </div>
          </div>
        </div>

        {/* Receipt */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>Receipt</div>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
            padding: 14, fontFamily: 'Inter', fontSize: 13,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {[
              ['Order', 'HOF—24—4218'],
              ['Date', 'Jun 18, 2026 · 4:14 PM'],
              ['Card', 'Visa ···· 4242'],
              ['Subtotal', '$28.00'],
              ['Fees', '$1.96'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                color: HOF.textSec,
              }}>
                <span>{k}</span><span style={{ color: HOF.text }}>{v}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0 0', marginTop: 4,
              borderTop: `1px solid ${HOF.border}`,
              fontWeight: 500, color: HOF.text,
            }}>
              <span>Total</span><span>$29.96</span>
            </div>
          </div>
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      <HofBottomNav active="profile" onChange={nav}/>

      <TransferSheet open={transferOpen} onClose={() => setTransferOpen(false)}/>
      <RefundSheet   open={refundOpen}   onClose={() => setRefundOpen(false)}/>
    </HofScreen>
  );
}

Object.assign(window, { ScreenTicket });
