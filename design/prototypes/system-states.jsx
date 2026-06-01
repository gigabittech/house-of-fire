// system-states.jsx — Loading skeletons, empty/error states, toasts, share sheet, map.

// ─── Skeleton loader (shimmer) ──────────────────────────────────────────────
function HofSkeleton({ width = '100%', height = 14, radius = 4, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(90deg, ${HOF.surface} 0%, ${HOF.elevated} 50%, ${HOF.surface} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'hof-shimmer 1.4s ease-in-out infinite',
      ...style,
    }}/>
  );
}

// Full home-feed loading skeleton card
function FeedSkeletonCard() {
  return (
    <div style={{
      background: HOF.surface, border: `1px solid ${HOF.border}`,
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <HofSkeleton width={32} height={32} radius={16}/>
        <div style={{ flex: 1 }}>
          <HofSkeleton width="35%" height={12}/>
          <HofSkeleton width="22%" height={10} style={{ marginTop: 6 }}/>
        </div>
      </div>
      <HofSkeleton width="80%" height={18} style={{ marginTop: 14 }}/>
      <HofSkeleton width="100%" height={12} style={{ marginTop: 10 }}/>
      <HofSkeleton width="90%"  height={12} style={{ marginTop: 6 }}/>
      <HofSkeleton width="50%"  height={12} style={{ marginTop: 6 }}/>
      <div style={{
        display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${HOF.border}`,
      }}>
        <HofSkeleton width={70} height={24} radius={12}/>
        <HofSkeleton width={70} height={24} radius={12}/>
      </div>
    </div>
  );
}

// ─── Empty states ───────────────────────────────────────────────────────────
function EmptyState({ icon = 'flame', title, body, action, secondary }) {
  return (
    <div style={{
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32, margin: '0 auto 16px',
        background: 'rgba(232,101,26,0.10)',
        border: `1px solid rgba(232,101,26,0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={26} color={HOF.amber}/>
      </div>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
        color: HOF.text, letterSpacing: '-0.01em',
      }}>{title}</div>
      {body && <div style={{
        fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8, lineHeight: 1.55,
        maxWidth: 280, marginLeft: 'auto', marginRight: 'auto',
      }}>{body}</div>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
      {secondary && <div style={{ marginTop: 10 }}>{secondary}</div>}
    </div>
  );
}

// ─── Error state ────────────────────────────────────────────────────────────
function ErrorState({ title, body, retry }) {
  return (
    <div style={{
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32, margin: '0 auto 16px',
        background: 'rgba(232,74,26,0.12)',
        border: `1px solid rgba(232,74,26,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="bolt" size={26} color={HOF.error}/>
      </div>
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
        color: HOF.text, letterSpacing: '-0.01em',
      }}>{title || "Couldn't load that"}</div>
      <div style={{
        fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8, lineHeight: 1.55,
        maxWidth: 280, marginLeft: 'auto', marginRight: 'auto',
      }}>{body || "Check your connection and try again. If it keeps happening, text the crew."}</div>
      <div style={{ marginTop: 18 }}>
        <HofButton variant="primary" onClick={retry}
                   icon={<Icon name="arrowR" size={14} color={HOF.bg}/>}>
          Try again
        </HofButton>
      </div>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function HofToast({ kind = 'success', children, onDismiss }) {
  const config = {
    success: { ic: 'check', color: HOF.success, bg: 'rgba(76,175,110,0.14)', br: 'rgba(76,175,110,0.4)' },
    info:    { ic: 'bell',  color: HOF.info,    bg: 'rgba(74,138,232,0.14)', br: 'rgba(74,138,232,0.4)' },
    warn:    { ic: 'bolt',  color: HOF.warning, bg: 'rgba(232,162,26,0.14)', br: 'rgba(232,162,26,0.4)' },
    error:   { ic: 'close', color: HOF.error,   bg: 'rgba(232,74,26,0.14)',  br: 'rgba(232,74,26,0.4)' },
  }[kind];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: HOF.surface, border: `1px solid ${config.br}`,
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      maxWidth: 380,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11,
        background: config.bg, border: `1px solid ${config.br}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={config.ic} size={12} color={config.color}/>
      </div>
      <span style={{
        flex: 1, fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.4,
      }}>{children}</span>
      {onDismiss && (
        <button className="hof-btn" onClick={onDismiss}
                style={{ width: 22, height: 22, borderRadius: 11, display: 'flex',
                         alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
          <Icon name="close" size={11} color={HOF.textSec}/>
        </button>
      )}
    </div>
  );
}

// ─── Confirmation modal ─────────────────────────────────────────────────────
function HofConfirm({ open, title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
                     destructive = false, onConfirm, onCancel }) {
  const { mounted, shown } = (function() {
    const [m, setM] = React.useState(open);
    const [s, setS] = React.useState(false);
    React.useEffect(() => {
      if (open) { setM(true); requestAnimationFrame(() => requestAnimationFrame(() => setS(true))); }
      else { setS(false); const t = setTimeout(() => setM(false), 200); return () => clearTimeout(t); }
    }, [open]);
    return { mounted: m, shown: s };
  })();
  if (!mounted) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
      opacity: shown ? 1 : 0, transition: 'opacity 180ms ease-out',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
           style={{
             width: '100%', maxWidth: 320,
             background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 14,
             padding: '24px 22px',
             transform: shown ? 'scale(1)' : 'scale(0.95)',
             opacity: shown ? 1 : 0,
             transition: 'transform 200ms ease-out, opacity 200ms',
             boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
           }}>
        <div style={{
          fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
          color: HOF.text, letterSpacing: '-0.01em',
        }}>{title}</div>
        <div style={{
          fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 6, lineHeight: 1.5,
        }}>{body}</div>
        <div style={{
          marginTop: 22, display: 'flex', gap: 8,
        }}>
          <HofButton variant="ghost" size="md" onClick={onCancel} full>{cancelLabel}</HofButton>
          <HofButton variant={destructive ? 'danger' : 'primary'} size="md" onClick={onConfirm} full>
            {confirmLabel}
          </HofButton>
        </div>
      </div>
    </div>
  );
}

// ─── Share sheet ────────────────────────────────────────────────────────────
function ShareSheet({ open, onClose }) {
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

  const shareLink = 'houseoffire.events/e/24';
  const channels = [
    { id: 'imsg', name: 'Messages',   color: '#34c759', icon: 'chat' },
    { id: 'ig',   name: 'Instagram',  color: '#E4405F', icon: 'camera' },
    { id: 'wa',   name: 'WhatsApp',   color: '#25d366', icon: 'chat' },
    { id: 'fb',   name: 'Facebook',   color: '#1877f2', icon: 'share' },
    { id: 'tw',   name: 'X',          color: '#000',    icon: 'share' },
    { id: 'mail', name: 'Mail',       color: '#1a73e8', icon: 'bell' },
  ];

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
        padding: '12px 16px 36px',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2, background: HOF.border, margin: '0 auto 14px',
        }}/>

        {/* Preview card */}
        <div style={{
          padding: 14, background: HOF.bg, border: `1px solid ${HOF.border}`,
          borderRadius: 12, marginBottom: 18, display: 'flex', gap: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          }}>
            <HofPhoto seed={1} gradient={false} style={{ width: '100%', height: '100%' }}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 600, fontSize: 15,
              color: HOF.text, letterSpacing: '-0.01em',
            }}>Fireversary · Ed 24</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>
              Fri Jun 26 · Junkyard · 47 left
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textDis, marginTop: 4 }}>
              {shareLink}
            </div>
          </div>
        </div>

        {/* App row */}
        <div className="hof-scroll" style={{
          display: 'flex', gap: 12, overflowX: 'auto', marginBottom: 16,
        }}>
          {channels.map(c => (
            <button key={c.id} className="hof-btn hof-press" style={{
              flexShrink: 0, width: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={c.icon} size={22} color="#fff"/>
              </div>
              <span style={{ fontFamily: 'Inter', fontSize: 11, color: HOF.textSec }}>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Action rows */}
        <div style={{
          background: HOF.elevated, borderRadius: 12, overflow: 'hidden',
        }}>
          <Row icon="download" label="Copy link" sub={shareLink}/>
          <Row icon="flame"    label="Share as a friend invite"
               sub="They get $5 off their first ticket. You get a beer on us."
               accent/>
          <Row icon="qr"       label="Show QR" sub="They scan it directly from your phone"/>
        </div>
      </div>
    </>
  );
}

function Row({ icon, label, sub, accent }) {
  return (
    <button className="hof-btn hof-press" style={{
      width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px',
      borderBottom: `1px solid ${HOF.border}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: accent ? HOF.amber : HOF.surface,
        border: `1px solid ${accent ? HOF.amber : HOF.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} size={16} color={accent ? HOF.bg : HOF.text}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{label}</div>
        <div style={{
          fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{sub}</div>
      </div>
      <Icon name="chev" size={14} color={HOF.textSec}/>
    </button>
  );
}

// ─── Map / Directions Sheet ─────────────────────────────────────────────────
function MapSheet({ open, onClose }) {
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

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: HOF.bg,
      transform: shown ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 260ms cubic-bezier(0.22, 0.84, 0.36, 1)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Map area — stylized dark map */}
      <div style={{ height: '60%', position: 'relative', overflow: 'hidden' }}>
        <DarkMap/>
        {/* Top bar overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '54px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button className="hof-btn hof-press" onClick={onClose} style={{
            width: 38, height: 38, borderRadius: 19,
            background: 'rgba(20,20,18,0.85)', backdropFilter: 'blur(12px)',
            border: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="close" size={16} color={HOF.text}/>
          </button>
          <button className="hof-btn hof-press" style={{
            width: 38, height: 38, borderRadius: 19,
            background: 'rgba(20,20,18,0.85)', backdropFilter: 'blur(12px)',
            border: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="users" size={16} color={HOF.text}/>
          </button>
        </div>

        {/* Pin callout */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)',
        }}>
          <div style={{
            padding: '8px 12px',
            background: HOF.amber, color: HOF.bg, borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          }}>
            <Icon name="flame" size={14} color={HOF.bg}/>
            <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13 }}>House of Fire</span>
          </div>
          <div style={{
            width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: `8px solid ${HOF.amber}`, margin: '0 auto',
          }}/>
        </div>
      </div>

      {/* Detail panel */}
      <div style={{
        flex: 1, background: HOF.bg, borderTop: `1px solid ${HOF.border}`,
        padding: '20px 18px', display: 'flex', flexDirection: 'column',
      }}>
        <div>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>The Venue</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 24,
            color: HOF.text, letterSpacing: '-0.01em', marginTop: 4,
          }}>Junkyard Social Club</div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 6 }}>
            2525 Pearl St, Boulder, CO 80302
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginTop: 12,
            fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec,
          }}>
            <span>0.8 mi · 4 min drive</span>
            <span style={{ color: HOF.textDis }}>·</span>
            <span>18 min walk</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <HofButton variant="primary" full icon={<Icon name="pin" size={16} color={HOF.bg}/>}>Directions</HofButton>
          <HofButton variant="ghost" icon={<Icon name="share" size={16} color={HOF.text}/>}>Share</HofButton>
        </div>

        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Icon name="bolt" size={14} color={HOF.warning}/>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.text, lineHeight: 1.5 }}>
            Use the <span style={{ fontWeight: 500 }}>side entrance on 23rd Street</span>. Look for the orange light. The main door is not in use.
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: '14px 16px',
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
        }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8,
          }}>Parking</div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.text, lineHeight: 1.5 }}>
            Street parking only — meters off after 6 PM. Lots fill up by 10. Bike rack at the side entrance, ride-share is easiest.
          </div>
        </div>
      </div>
    </div>
  );
}

// Stylized dark map placeholder — a real-feeling grid
function DarkMap() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0d0c0a' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        {/* base */}
        <rect width="400" height="400" fill="#0d0c0a"/>
        {/* fine grid */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="#16140f" strokeWidth="0.5"/>
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="#16140f" strokeWidth="0.5"/>
        ))}
        {/* roads (Pearl St area abstracted) */}
        <path d="M0 200 L400 195" stroke="#3a3833" strokeWidth="6"/>
        <path d="M0 200 L400 195" stroke="#5a564e" strokeWidth="1"/>
        <path d="M120 0 L130 400" stroke="#2a2826" strokeWidth="4"/>
        <path d="M260 0 L270 400" stroke="#2a2826" strokeWidth="4"/>
        <path d="M0 320 L400 315" stroke="#2a2826" strokeWidth="3"/>
        <path d="M0 80 L400 85" stroke="#2a2826" strokeWidth="3"/>

        {/* park (open space block) */}
        <rect x="40" y="240" width="60" height="60" fill="#11251a" stroke="#1c3023" strokeWidth="0.5"/>
        {/* random building footprints */}
        {[
          [150, 110, 80, 60], [150, 220, 80, 60], [280, 110, 90, 50], [280, 230, 70, 60],
          [40, 110, 70, 70], [40, 30, 60, 40],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="#1a1813" stroke="#2a2826" strokeWidth="0.5"/>
        ))}

        {/* HoF building highlight */}
        <rect x="170" y="170" width="60" height="60" fill="#2a1006" stroke={HOF.amber} strokeWidth="2"/>

        {/* pin pulse */}
        <circle cx="200" cy="200" r="24" fill={HOF.amber} fillOpacity="0.15">
          <animate attributeName="r" values="20;36;20" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="200" cy="200" r="6" fill={HOF.amber}/>
        <circle cx="200" cy="200" r="3" fill={HOF.bg}/>
      </svg>
    </div>
  );
}

Object.assign(window, {
  HofSkeleton, FeedSkeletonCard,
  EmptyState, ErrorState,
  HofToast, HofConfirm,
  ShareSheet, MapSheet, DarkMap,
});
