// final-artifacts.jsx — Apple Watch ticket, print receipt, tier upgrade sheet.

// ─── Apple Watch Ticket ─────────────────────────────────────────────────────
function AppleWatchTicket() {
  return (
    <div style={{
      width: 360, padding: 24, background: HOF.bg, borderRadius: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Watch frame */}
      <div style={{
        width: 220, height: 268, borderRadius: 44,
        padding: 16,
        background: '#1a1a1a',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 2px #2a2a2a',
      }}>
        {/* Digital crown nub */}
        <div style={{
          position: 'absolute', right: -4, top: 70, width: 5, height: 28,
          background: '#2a2a2a', borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute', right: -3, top: 130, width: 4, height: 16,
          background: '#2a2a2a', borderRadius: 1,
        }}/>

        {/* Screen */}
        <div style={{
          width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden',
          background: '#000', display: 'flex', flexDirection: 'column',
        }}>
          {/* Top — small status */}
          <div style={{
            padding: '12px 14px 6px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono', fontSize: 9, color: HOF.amber,
              fontWeight: 600, letterSpacing: '0.16em',
            }}>HoF · 24</div>
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 11, color: HOF.text, fontWeight: 600,
            }}>7:42</div>
          </div>

          {/* QR */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 14px',
          }}>
            <div style={{
              padding: 8, background: HOF.text, borderRadius: 8,
            }}>
              <FakeQR size={130} fg={HOF.bg} bg={HOF.text}/>
            </div>
          </div>

          {/* Bottom — ID */}
          <div style={{
            padding: '6px 14px 12px', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono', fontSize: 9, color: HOF.text,
              letterSpacing: '0.16em', fontWeight: 600,
            }}>HOF—24—4218</div>
            <div style={{
              fontFamily: 'Inter, system-ui', fontSize: 9, color: HOF.textSec, marginTop: 2,
            }}>Sujan B · GA</div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 18, padding: '0 4px', textAlign: 'center', maxWidth: 280,
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, lineHeight: 1.5,
      }}>
        <span style={{ color: HOF.text, fontWeight: 500 }}>Watch face.</span> Wrist-up at the door, raise the brightness, scan in 2 seconds.
      </div>
    </div>
  );
}

// ─── Printable Receipt / Statement (8.5×11 page) ────────────────────────────
function PrintReceipt() {
  return (
    <div style={{
      width: 612, height: 792, // letter @ 72dpi
      background: '#fff', color: '#111',
      fontFamily: 'Inter, Helvetica, sans-serif',
      padding: '48px 56px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Letterhead */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        paddingBottom: 18, borderBottom: '2px solid #111',
      }}>
        <div>
          <img src="assets/hof-logo-black.png" alt="House of Fire" style={{
            height: 28, width: 'auto', display: 'block',
          }}/>
          <div style={{
            fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 10,
            color: '#666', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 8,
          }}>houseoffire.events · Boulder, CO</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 10,
            color: '#666', letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>Receipt</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600,
            color: '#111', marginTop: 4, letterSpacing: '0.12em',
          }}>HOF—24—4218</div>
          <div style={{ fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11, color: '#666', marginTop: 4 }}>
            Issued Jun 18, 2026
          </div>
        </div>
      </div>

      {/* Buyer / Event */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
        marginTop: 24,
      }}>
        <div>
          <div style={{ fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 9, color: '#666',
                        letterSpacing: '0.22em', textTransform: 'uppercase' }}>Buyer</div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: '#111' }}>
            <div style={{ fontWeight: 600 }}>Sujan Bhuiyan</div>
            <div>sujan@example.com</div>
            <div>(303) 555-0142</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 9, color: '#666',
                        letterSpacing: '0.22em', textTransform: 'uppercase' }}>Event</div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: '#111' }}>
            <div style={{ fontWeight: 600 }}>Fireversary · Theme 24</div>
            <div>Friday, June 26, 2026 · 8:00 PM</div>
            <div>Junkyard Social Club</div>
            <div>2525 Pearl St, Boulder, CO 80302</div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={{
        marginTop: 32, borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Description', 'Qty', 'Unit', 'Total'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i > 0 ? 'right' : 'left',
                  padding: '12px 0', fontFamily: 'Inter, Helvetica, sans-serif',
                  fontSize: 10, color: '#666',
                  letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '12px 0' }}>
                <div style={{ fontWeight: 500 }}>General Admission</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Holder: Sujan Bhuiyan · ID: HOF—24—4218</div>
              </td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>1</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>$28.00</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>$28.00</td>
            </tr>
            <tr style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '12px 0', color: '#666' }}>Service fee (7%)</td>
              <td style={{ padding: '12px 0', textAlign: 'right' }}></td>
              <td style={{ padding: '12px 0', textAlign: 'right' }}></td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>$1.96</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div style={{
        marginTop: 18, display: 'flex', justifyContent: 'flex-end',
      }}>
        <div style={{ width: 280 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', fontSize: 14, color: '#444',
          }}>
            <span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>$29.96</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', fontSize: 14, color: '#444',
          }}>
            <span>Tax</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>$0.00</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '14px 0 0', borderTop: '2px solid #111', marginTop: 8,
            fontSize: 18, fontWeight: 600, color: '#000',
          }}>
            <span>Total Paid</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>$29.96</span>
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 6, textAlign: 'right' }}>
            Charged to Visa ···· 4242 on Jun 18, 2026
          </div>
        </div>
      </div>

      {/* Footer / policy */}
      <div style={{ flex: 1 }}/>
      <div style={{
        paddingTop: 18, borderTop: '1px solid #ddd',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        fontSize: 10, color: '#666', lineHeight: 1.6,
      }}>
        <div>
          <div style={{ fontWeight: 600, color: '#111', letterSpacing: '0.16em',
                        textTransform: 'uppercase', fontSize: 9, marginBottom: 6 }}>Transfer</div>
          Tickets are transferable up to 24 hours before doors. Use the app or reply to this receipt.
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#111', letterSpacing: '0.16em',
                        textTransform: 'uppercase', fontSize: 9, marginBottom: 6 }}>Refunds</div>
          Tickets are non-refundable but we review case-by-case. Text the crew at (303) 555-0124.
        </div>
      </div>
      <div style={{
        marginTop: 18, textAlign: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#888', letterSpacing: '0.16em',
      }}>House of Fire · houseoffire.events · Thank you for keeping the room full.</div>
    </div>
  );
}

// ─── Tier upgrade sheet (GA → VIP) ──────────────────────────────────────────
function UpgradeSheet({ open, onClose }) {
  const { mounted, shown } = (function() {
    const [m, setM] = React.useState(open);
    const [s, setS] = React.useState(false);
    React.useEffect(() => {
      if (open) { setM(true); requestAnimationFrame(() => requestAnimationFrame(() => setS(true))); }
      else { setS(false); const t = setTimeout(() => setM(false), 220); return () => clearTimeout(t); }
    }, [open]);
    return { mounted: m, shown: s };
  })();
  if (!mounted) return null;

  const benefits = [
    { ic: 'star',    t: 'Private room',      s: 'A second room with its own bar, away from the main floor.' },
    { ic: 'flame',   t: 'First drink on us', s: 'One pour at the bar — bourbon, mezcal, beer, or water with a fancy garnish.' },
    { ic: 'ticket',  t: 'Member pre-sale',   s: '24 hours of access to tickets before they open to the public.' },
    { ic: 'image',   t: 'Photo first look',  s: 'See recap photos a week before they hit the public archive.' },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.6)',
        opacity: shown ? 1 : 0, transition: 'opacity 200ms ease-out',
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 90,
        background: HOF.surface, borderTop: `1px solid ${HOF.border}`,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        transform: shown ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 240ms cubic-bezier(0.22, 0.84, 0.36, 1)',
        boxShadow: '0 -24px 60px rgba(0,0,0,0.55)',
        maxHeight: '92%', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: HOF.border, margin: '12px auto 0' }}/>

        {/* Header banner */}
        <div style={{
          position: 'relative', padding: '24px 22px 22px',
          background: `linear-gradient(135deg, ${HOF.gold} 0%, ${HOF.amber} 100%)`,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          margin: '8px 0 0',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: 'rgba(10,10,8,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="star" size={16} color={HOF.bg}/>
            </div>
            <span style={{
              fontFamily: 'Inter', fontWeight: 600, fontSize: 11, color: HOF.bg,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Upgrade to VIP</span>
          </div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 700, fontSize: 30,
            color: HOF.bg, letterSpacing: '-0.02em', lineHeight: 1.05,
            textTransform: 'uppercase',
          }}>
            The room behind<br/>the room.
          </div>
          <div style={{
            fontFamily: 'Inter', fontSize: 13, color: HOF.bg, opacity: 0.75,
            marginTop: 10, lineHeight: 1.5, maxWidth: 300,
          }}>
            12 of you have done this since Theme 10. They keep doing it. There's a reason.
          </div>
        </div>

        {/* Benefits */}
        <div className="hof-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 28px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.gold,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 12,
          }}>What you get</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                background: HOF.bg, border: `1px solid ${HOF.border}`, borderRadius: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(201,148,42,0.12)',
                  border: `1px solid rgba(201,148,42,0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={b.ic} size={16} color={HOF.gold}/>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text,
                  }}>{b.t}</div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2, lineHeight: 1.5,
                  }}>{b.s}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Price ladder */}
          <div style={{
            marginTop: 22, padding: 18,
            background: HOF.bg, border: `1px solid ${HOF.gold}`, borderRadius: 12,
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: 'Inter', fontSize: 13, color: HOF.textSec,
              }}>Your current ticket · GA</span>
              <span style={{
                fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.textSec,
                fontVariantNumeric: 'tabular-nums', textDecoration: 'line-through',
              }}>$28</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8,
            }}>
              <span style={{
                fontFamily: 'Inter', fontSize: 14, color: HOF.text, fontWeight: 500,
              }}>Upgrade to VIP</span>
              <span style={{
                fontFamily: 'Clash Display', fontWeight: 700, fontSize: 22,
                color: HOF.gold, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
              }}>+$27</span>
            </div>
            <div style={{
              marginTop: 10, paddingTop: 10, borderTop: `1px solid ${HOF.border}`,
              fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
            }}>
              Charges Visa ···· 4242 · 10 VIP spots left for Theme 24
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <HofButton variant="gold" full
                       icon={<Icon name="star" size={16} color={HOF.bg}/>}>
              Upgrade for $27
            </HofButton>
            <div style={{ height: 8 }}/>
            <HofButton variant="ghost" full onClick={onClose}>
              Stay on GA
            </HofButton>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AppleWatchTicket, PrintReceipt, UpgradeSheet });
