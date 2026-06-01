// brand-artifacts.jsx — Wallet pass, email templates, push notification previews.
// These are designed artifacts shown inside their host UI (iOS Wallet card,
// email client window, iOS lockscreen).

// ─── Apple Wallet Pass ──────────────────────────────────────────────────────
function WalletPassApple() {
  return (
    <div style={{
      width: 340, padding: 14, borderRadius: 18,
      background: HOF.bg,
    }}>
      {/* iOS Wallet card */}
      <div style={{
        background: '#0A0A08',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        color: HOF.text, position: 'relative',
      }}>
        {/* Top — branded strip */}
        <div style={{
          padding: '14px 18px 12px',
          background: `linear-gradient(135deg, ${HOF.ember} 0%, ${HOF.amber} 100%)`,
          color: HOF.bg,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7,
            }}>House of Fire</div>
            <img src="assets/hof-logo-black.png" alt="" style={{
              height: 22, width: 'auto', marginTop: 6, marginLeft: -2, display: 'block',
            }}/>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Inter', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.7,
            }}>Tier</div>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 700, fontSize: 18, marginTop: 2,
              letterSpacing: '-0.01em',
            }}>GA</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 18px 4px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 9, color: HOF.textSec, fontWeight: 600,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>Edition 24</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 700, fontSize: 24,
            color: HOF.text, letterSpacing: '-0.02em', textTransform: 'uppercase',
            marginTop: 4, lineHeight: 1,
          }}>Fireversary</div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            marginTop: 16,
          }}>
            {[
              ['Date',  'Fri Jun 26'],
              ['Doors', '8:00 PM'],
              ['Venue', 'Junkyard'],
              ['Holder','Sujan B.'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{
                  fontFamily: 'Inter', fontSize: 8, color: HOF.textSec, fontWeight: 600,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                }}>{k}</div>
                <div style={{
                  fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text, marginTop: 2,
                }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* QR strip */}
        <div style={{
          marginTop: 16, padding: '14px 0 14px',
          background: HOF.text,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <FakeQR size={140} fg={HOF.bg} bg={HOF.text}/>
          <div style={{
            marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.bg,
            letterSpacing: '0.18em', fontWeight: 600,
          }}>HOF—24—4218</div>
        </div>

        {/* Footer (pass back-side cue) */}
        <div style={{
          padding: '10px 18px 14px',
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.04em', textAlign: 'center',
        }}>
          Tap to flip · Updates from House of Fire
        </div>
      </div>

      {/* Caption */}
      <div style={{
        marginTop: 14, padding: '0 4px',
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, lineHeight: 1.5,
      }}>
        <span style={{ color: HOF.text, fontWeight: 500 }}>Apple Wallet pass.</span> Auto-updates with set-time changes and venue notes. Push notifications when you arrive.
      </div>
    </div>
  );
}

// ─── Google Wallet Pass ─────────────────────────────────────────────────────
function WalletPassGoogle() {
  return (
    <div style={{ width: 340, padding: 14, borderRadius: 18, background: HOF.bg }}>
      <div style={{
        background: '#fff', borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        color: '#202124', fontFamily: 'Inter, Roboto, sans-serif',
      }}>
        {/* Branded header */}
        <div style={{
          padding: '14px 18px 10px',
          background: `linear-gradient(135deg, ${HOF.ember} 0%, ${HOF.amber} 100%)`,
          color: HOF.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: HOF.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="flame" size={16} color={HOF.amber}/>
            </div>
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 600,
                            letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.7 }}>House of Fire</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }}>Event ticket</div>
            </div>
          </div>
          <div style={{
            padding: '3px 8px', borderRadius: 4,
            background: 'rgba(10,10,8,0.2)',
            fontFamily: 'Inter', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>GA</div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 4px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 11, color: '#5f6368',
          }}>Edition 24 · Friday, Jun 26 · 8:00 PM</div>
          <div style={{
            fontFamily: 'Inter', fontWeight: 700, fontSize: 22, color: '#202124',
            marginTop: 4, textTransform: 'uppercase',
          }}>Fireversary</div>
          <div style={{
            fontFamily: 'Inter', fontSize: 13, color: '#3c4043', marginTop: 6,
          }}>Junkyard Social Club · 2525 Pearl St, Boulder</div>
        </div>

        {/* Holder block */}
        <div style={{
          margin: '14px 18px 0', padding: '12px 14px',
          background: '#f1f3f4', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: 10, color: '#5f6368', fontWeight: 500 }}>HOLDER</div>
            <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: '#202124', marginTop: 2 }}>
              Sujan Bhuiyan
            </div>
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#5f6368',
            letterSpacing: '0.16em',
          }}>HOF—24—4218</div>
        </div>

        {/* QR strip */}
        <div style={{
          marginTop: 14, padding: '16px 0 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          borderTop: '1px solid #e8eaed',
        }}>
          <FakeQR size={150} fg="#202124" bg="#fff"/>
        </div>

        {/* CTAs row */}
        <div style={{
          display: 'flex', borderTop: '1px solid #e8eaed',
        }}>
          {[['Add to home','plus'], ['Directions','pin'], ['Share','share']].map(([l, ic]) => (
            <div key={l} style={{
              flex: 1, padding: '12px 0', textAlign: 'center',
              borderRight: l !== 'Share' ? '1px solid #e8eaed' : 'none',
            }}>
              <Icon name={ic} size={16} color="#1a73e8" style={{ margin: '0 auto' }}/>
              <div style={{
                fontFamily: 'Inter', fontSize: 11, color: '#1a73e8', marginTop: 4, fontWeight: 500,
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 14, padding: '0 4px',
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, lineHeight: 1.5,
      }}>
        <span style={{ color: HOF.text, fontWeight: 500 }}>Google Wallet pass.</span> Same model — branded header, holder lookup, live updates.
      </div>
    </div>
  );
}

// ─── Email Template — Smoke Signal Newsletter ───────────────────────────────
function EmailSmokeSignal() {
  return (
    <EmailFrame subject="✦ This Friday — Fireversary lineup is final" preheader="HEX takes the 12 slot. Doors at 8.">
      <div style={{ padding: '32px 32px 24px' }}>
        <img src="assets/hof-logo-color.png" alt="House of Fire" style={{
          height: 36, width: 'auto', display: 'block',
        }}/>
        <div style={{
          fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 10,
          color: '#999', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 10,
        }}>The Smoke Signal · No. 24</div>
      </div>
      <div style={{
        height: 260, position: 'relative', overflow: 'hidden',
      }}>
        <img src="assets/photos/p1-laser-dj.jpg" alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%',
        }}/>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '24px 32px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,8,0.85) 60%, #0A0A08 100%)',
        }}>
          <div style={{
            fontFamily: 'Clash Display, Helvetica, sans-serif', fontWeight: 700, fontSize: 32,
            color: '#F0EDE6', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1,
          }}>Fireversary<br/>
            <span style={{ color: HOF.glow }}>2-year anniversary</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 32px', color: '#222', fontFamily: 'Inter, Helvetica, sans-serif' }}>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 16px' }}>
          Friday is the night. Two years of House of Fire. The lineup is locked.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 16px', fontWeight: 500 }}>
          IGNYTE → M3DIUM → <span style={{ color: HOF.amber }}>HEX</span> → Residents
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 24px', color: '#555' }}>
          Doors at 8 sharp — we open the floor at 9. Side entrance on 23rd Street. Orange light. If you don't have a ticket yet, we have <strong style={{ color: '#000' }}>47 GA</strong> and 12 VIP left.
        </p>
        <a href="#" style={{
          display: 'inline-block', padding: '14px 28px',
          background: HOF.amber, color: HOF.bg, textDecoration: 'none',
          fontFamily: 'Inter, Helvetica, sans-serif', fontWeight: 600, fontSize: 14,
          letterSpacing: '0.02em', borderRadius: 6,
        }}>Lock in your ticket →</a>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '32px 0' }}/>

        <div style={{
          fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11,
          color: '#999', letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>House notes</div>
        <ul style={{
          fontSize: 14, lineHeight: 1.7, color: '#444', marginTop: 12, paddingLeft: 20,
        }}>
          <li>Coat check is <strong>$3 cash</strong> tonight.</li>
          <li><strong>No phones on the floor.</strong> Mauro will do photos.</li>
          <li>Water is free. Pace yourself. We close at 1 AM.</li>
        </ul>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '32px 0' }}/>

        <div style={{ fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 1.6 }}>
          You're getting this because you're on The Smoke Signal.<br/>
          <a href="#" style={{ color: '#999' }}>Update preferences</a> · <a href="#" style={{ color: '#999' }}>Unsubscribe</a><br/>
          House of Fire · Boulder, CO
        </div>
      </div>
    </EmailFrame>
  );
}

// ─── Email Template — Ticket Receipt ────────────────────────────────────────
function EmailReceipt() {
  return (
    <EmailFrame subject="Your ticket for Fireversary — Jun 26" preheader="HOF—24—4218 · $29.96">
      <div style={{ padding: '32px 32px 16px', borderBottom: '1px solid #eee' }}>
        <img src="assets/hof-logo-color.png" alt="House of Fire" style={{
          height: 32, width: 'auto', display: 'block',
        }}/>
        <div style={{
          fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11, color: '#999',
          letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 10,
        }}>Receipt · HOF—24—4218</div>
      </div>

      <div style={{ padding: '28px 32px', color: '#222', fontFamily: 'Inter, Helvetica, sans-serif' }}>
        <h1 style={{
          fontFamily: 'Clash Display, Helvetica, sans-serif', fontWeight: 700, fontSize: 28,
          letterSpacing: '-0.02em', margin: 0, color: '#000',
        }}>You're in.</h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12, color: '#555' }}>
          Hi Sujan — your ticket for Fireversary (Edition 24) is confirmed. The QR below is your entry. Show this email or open it in the app.
        </p>

        {/* Big QR */}
        <div style={{
          margin: '24px 0', padding: '24px',
          background: '#fafaf8', border: '1px solid #eee', borderRadius: 8,
          textAlign: 'center',
        }}>
          <FakeQR size={180} fg="#000" bg="#fafaf8"/>
          <div style={{
            marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#222',
            letterSpacing: '0.18em', fontWeight: 600,
          }}>HOF—24—4218</div>
        </div>

        {/* Event facts */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          {[
            ['Event',  'Fireversary · Edition 24'],
            ['Date',   'Friday, June 26, 2026'],
            ['Doors',  '8:00 PM'],
            ['Venue',  'Junkyard Social Club · 2525 Pearl St'],
            ['Tier',   'General Admission'],
            ['Holder', 'Sujan Bhuiyan'],
          ].map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '8px 0', color: '#888', fontWeight: 400, width: 90 }}>{k}</td>
              <td style={{ padding: '8px 0', color: '#222', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </table>

        {/* Itemized */}
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }}/>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <tr><td style={{ padding: '6px 0', color: '#666' }}>1× GA ticket</td>
              <td style={{ padding: '6px 0', textAlign: 'right', color: '#222' }}>$28.00</td></tr>
          <tr><td style={{ padding: '6px 0', color: '#666' }}>Service fee</td>
              <td style={{ padding: '6px 0', textAlign: 'right', color: '#222' }}>$1.96</td></tr>
          <tr style={{ borderTop: '1px solid #eee' }}>
            <td style={{ padding: '12px 0 0', fontWeight: 600, color: '#000' }}>Total · Visa ···· 4242</td>
            <td style={{ padding: '12px 0 0', textAlign: 'right', fontWeight: 600, color: '#000', fontSize: 17 }}>$29.96</td>
          </tr>
        </table>

        <div style={{
          marginTop: 28, padding: 16, background: '#fef7f1', border: '1px solid #f3d4b8',
          borderRadius: 6, fontSize: 13, color: '#5a3210', lineHeight: 1.6,
        }}>
          <strong>Need to transfer?</strong> Open the app, find this ticket, tap Transfer. Up to 24h before doors. Refunds reviewed case-by-case — reply to this email.
        </div>
      </div>

      <div style={{
        padding: '20px 32px 32px', textAlign: 'center',
        fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11, color: '#999', lineHeight: 1.6,
      }}>
        House of Fire · Boulder, CO · <a href="#" style={{ color: '#999' }}>Get receipt PDF</a>
      </div>
    </EmailFrame>
  );
}

// ─── Email Template — Reply notification ────────────────────────────────────
function EmailReply() {
  return (
    <EmailFrame subject="Devon replied to your post" preheader='"how strict is no-phones-on-the-floor?"'>
      <div style={{ padding: '32px 32px 24px' }}>
        <img src="assets/hof-logo-color.png" alt="House of Fire" style={{
          height: 28, width: 'auto', display: 'block',
        }}/>
      </div>
      <div style={{ padding: '0 32px 28px', color: '#222', fontFamily: 'Inter, Helvetica, sans-serif' }}>
        <h2 style={{
          fontFamily: 'Clash Display, Helvetica, sans-serif', fontWeight: 700, fontSize: 22,
          letterSpacing: '-0.01em', margin: 0, color: '#000',
        }}>Devon replied to your post</h2>
        <div style={{ fontSize: 12, color: '#999', marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          #help · 8 minutes ago
        </div>

        <div style={{
          marginTop: 20, padding: 18, background: '#fafaf8', border: '1px solid #eee',
          borderLeft: `3px solid ${HOF.amber}`, borderRadius: 4,
        }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            You wrote:
          </div>
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.55, fontStyle: 'italic' }}>
            "First-timer question — how strict is no-phones-on-the-floor? Can I check in once during the night to message my ride?"
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: 18, background: '#fff', border: '1px solid #ddd', borderRadius: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18,
              background: '#e8e6df', color: '#444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, Helvetica, sans-serif', fontWeight: 600, fontSize: 13,
            }}>DP</div>
            <div>
              <div style={{ fontFamily: 'Inter, Helvetica, sans-serif', fontWeight: 600, fontSize: 13 }}>Devon</div>
              <div style={{ fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11, color: '#999' }}>Member · 8m ago</div>
            </div>
          </div>
          <div style={{ fontSize: 15, color: '#222', lineHeight: 1.6 }}>
            Honestly pretty chill — they ask, they don't snatch. Just don't be the one shooting the floor. Step into the lobby for the message, no one cares.
          </div>
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <a href="#" style={{
            display: 'inline-block', padding: '12px 22px',
            background: HOF.amber, color: HOF.bg, textDecoration: 'none',
            fontFamily: 'Inter, Helvetica, sans-serif', fontWeight: 600, fontSize: 14,
            borderRadius: 6,
          }}>Reply in the app →</a>
        </div>
      </div>

      <div style={{
        padding: '20px 32px 32px', textAlign: 'center',
        fontFamily: 'Inter, Helvetica, sans-serif', fontSize: 11, color: '#999',
      }}>
        <a href="#" style={{ color: '#999' }}>Mute this thread</a> · <a href="#" style={{ color: '#999' }}>Notification settings</a>
      </div>
    </EmailFrame>
  );
}

function EmailFrame({ subject, preheader, children }) {
  return (
    <div style={{
      width: 580, background: '#e8e6df', padding: 16, borderRadius: 12,
      fontFamily: 'Inter, Helvetica, sans-serif',
    }}>
      <div style={{
        padding: '0 4px 10px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13, color: '#222', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>House of Fire &lt;crew@houseoffire.events&gt;</div>
          <div style={{
            fontSize: 12, color: '#777', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>to you · just now</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 32px', borderBottom: '1px solid #eee',
          fontSize: 16, color: '#000', fontWeight: 600,
        }}>{subject}</div>
        {preheader && <div style={{
          padding: '6px 32px 12px', fontSize: 12, color: '#888',
        }}>{preheader}</div>}
        {children}
      </div>
    </div>
  );
}

// ─── Push notification previews (iOS lockscreen) ────────────────────────────
function PushIosLockscreen() {
  return (
    <div style={{
      width: 360, padding: 20, borderRadius: 24,
      background: 'linear-gradient(160deg, #2a1a1a 0%, #0a0a08 70%)',
      color: HOF.text, fontFamily: 'Inter, system-ui',
    }}>
      {/* Mock lockscreen clock */}
      <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 13, color: HOF.text, opacity: 0.9, fontWeight: 400,
        }}>Friday, June 26</div>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 84, fontWeight: 200,
          color: HOF.text, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>7:42</div>
      </div>

      {/* Stack of notifications */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PushCard
          appName="House of Fire"
          time="now"
          title="Doors open in 18 minutes"
          body="See you tonight, Sujan. Your QR is ready in the app."
        />
        <PushCard
          appName="House of Fire"
          time="2m ago"
          title="Jordan posted in #general"
          body="Edition 24 lineup is final — HEX takes the 12 slot."
        />
        <PushCard
          appName="House of Fire"
          time="5m ago"
          title="Devon replied to your post"
          body="Honestly pretty chill — they ask, they don't snatch."
        />
      </div>

      <div style={{
        marginTop: 28, textAlign: 'center',
        fontFamily: 'Inter', fontSize: 11, color: HOF.textSec, lineHeight: 1.5,
      }}>
        Three pushes that ladder from <em>useful</em> to <em>social</em>. Stack collapses to "House of Fire · 3" if user is in a quiet mode.
      </div>
    </div>
  );
}

function PushCard({ appName, time, title, body }) {
  return (
    <div style={{
      background: 'rgba(40,40,38,0.7)', backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '10px 12px',
      display: 'flex', gap: 10,
    }}>
      {/* App icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${HOF.ember}, ${HOF.amber})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="flame" size={20} color={HOF.bg}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{
            fontFamily: 'Inter, system-ui', fontSize: 12, fontWeight: 500, color: HOF.text,
            opacity: 0.7,
          }}>{appName}</span>
          <span style={{
            fontFamily: 'Inter, system-ui', fontSize: 11, color: HOF.text, opacity: 0.5,
          }}>{time}</span>
        </div>
        <div style={{
          fontFamily: 'Inter, system-ui', fontWeight: 600, fontSize: 14, color: HOF.text,
          marginTop: 2,
        }}>{title}</div>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 13, color: HOF.text, opacity: 0.85,
          marginTop: 2, lineHeight: 1.4,
        }}>{body}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  WalletPassApple, WalletPassGoogle,
  EmailSmokeSignal, EmailReceipt, EmailReply,
  PushIosLockscreen,
});
