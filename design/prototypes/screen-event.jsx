// screen-event.jsx — Event detail page (upcoming)

function ScreenEvent({ nav, onBack, onOpenCheckout, onOpenPost, startCalOpen = false }) {
  const [selectedTier, setSelectedTier] = React.useState('ga');
  const [openFaq, setOpenFaq] = React.useState(0);
  const [calOpen, setCalOpen] = React.useState(startCalOpen);

  const tiers = [
    { id: 'early', name: 'Early Bird', price: 20, sub: 'Doors 8 — 10 PM', remaining: 0,  tone: 'soldout' },
    { id: 'ga',    name: 'General',    price: 28, sub: 'Doors all night',   remaining: 47, tone: 'normal' },
    { id: 'vip',   name: 'VIP',        price: 55, sub: 'Private room · 1 drink', remaining: 12, tone: 'gold' },
  ];

  const lineup = [
    { t: '9:00', name: 'IGNYTE',   note: 'Opening · Boulder' },
    { t: '10:30', name: 'M3DIUM',  note: 'House' },
    { t: '12:00', name: 'TBA',     note: 'Headliner — announced 6/20' },
    { t: '1:00', name: 'After',    note: 'DJ residents close' },
  ];

  const faqs = [
    { q: 'Where do I get in?',
      a: 'The side entrance on 23rd Street. Look for the orange light. We do not use the main door.' },
    { q: 'Dress code?',
      a: 'No code. People show up looking like themselves. Wear what makes you move.' },
    { q: 'Is there a coat check?',
      a: 'Yes — $3. Cash or in-app. The line moves fastest before 10:30.' },
    { q: 'Can I bring a friend who didn\'t buy a ticket?',
      a: 'Only if they bought a ticket. We do not sell at the door. We sell out every month.' },
  ];

  return (
    <HofScreen>
      <HofTopBar title="Event" onBack={onBack} transparent={true}
                 right={
                   <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                     <button className="hof-btn hof-press" onClick={() => setCalOpen(true)}
                             aria-label="Add to calendar"
                             style={{
                               width: 38, height: 38, borderRadius: 19,
                               background: 'rgba(20,20,18,0.7)',
                               backdropFilter: 'blur(12px)',
                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                               border: `1px solid ${HOF.border}`, position: 'relative',
                             }}>
                       <Icon name="calendar" size={18} color={HOF.text}/>
                       <span style={{
                         position: 'absolute', top: -2, right: -2,
                         width: 14, height: 14, borderRadius: 7,
                         background: HOF.amber, color: HOF.bg,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontFamily: 'Inter', fontSize: 11, fontWeight: 700, lineHeight: 1,
                         border: `2px solid ${HOF.bg}`,
                       }}>+</span>
                     </button>
                     <Icon name="share" size={20} color={HOF.text}/>
                   </div>
                 }/>

      <HofScroll>
        {/* Hero */}
        <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
          <HofPhoto seed={1} gradient={false} style={{ position: 'absolute', inset: 0 }} objectPosition="center 40%"/>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 240,
            background: 'linear-gradient(180deg, transparent, rgba(10,10,8,0.85) 60%, #0A0A08)',
          }}/>
          <div style={{
            position: 'absolute', left: 16, right: 16, bottom: 18,
          }}>
            <HofPill tone="amber">Upcoming · Edition № 24</HofPill>
            <div style={{
              fontFamily: 'Clash Display', fontWeight: 700, fontSize: 38,
              lineHeight: 1, color: HOF.text, marginTop: 10, letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}>
              Fireversary<br/>
              <span style={{ color: HOF.amber }}>2-Year Anniversary</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div style={{
          padding: '20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        }}>
          <Meta icon="calendar" label="Date"    value="Fri, June 26 · 2026"/>
          <Meta icon="clock"    label="Doors"   value="8 PM — 1 AM"/>
          <Meta icon="pin"      label="Venue"   value="Junkyard Social Club"/>
          <Meta icon="users"    label="Capacity" value="300 · sold out 23/24"/>
        </div>

        {/* Add to Calendar */}
        <div style={{ padding: '0 16px 4px' }}>
          <button className="hof-btn hof-press" onClick={() => setCalOpen(true)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: HOF.surface,
                    border: `1px solid ${HOF.border}`, borderRadius: 12,
                    textAlign: 'left',
                  }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(232,101,26,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="calendar" size={18} color={HOF.amber}/>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>
                  Add to Calendar
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 1 }}>
                  Apple · Google · Outlook · .ics
                </div>
              </div>
            </div>
            <Icon name="chev" size={16} color={HOF.textSec}/>
          </button>
        </div>

        {/* Section: Ticket tiers */}
        <SectionLabel>Tickets</SectionLabel>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tiers.map(t => (
            <TierCard key={t.id} tier={t}
                      selected={selectedTier === t.id}
                      onSelect={() => t.remaining > 0 && setSelectedTier(t.id)}/>
          ))}
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          <HofButton variant="primary" full onClick={onOpenCheckout}
                     icon={<Icon name="arrowR" size={18} color={HOF.bg}/>}>
            Continue to checkout
          </HofButton>
        </div>

        {/* What to expect */}
        <SectionLabel>What to expect</SectionLabel>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['House and techno', 'Five hours, four artists, one room.'],
            ['No phones on the floor', 'Photos by the in-house photographer only.'],
            ['Water is free', 'Hydrate. Pace yourself. We close at one.'],
          ].map(([t, s]) => (
            <div key={t} style={{
              display: 'flex', gap: 14, padding: '12px 0',
              borderBottom: `1px solid ${HOF.border}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'rgba(232,101,26,0.12)', color: HOF.amber,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="check" size={16} color={HOF.amber}/>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{t}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 2 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Lineup */}
        <SectionLabel>Lineup</SectionLabel>
        <div style={{ padding: '0 16px' }}>
          {lineup.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
              borderBottom: i < lineup.length - 1 ? `1px solid ${HOF.border}` : 'none',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono', fontSize: 13, color: HOF.textSec,
                width: 50, fontVariantNumeric: 'tabular-nums',
              }}>{l.t}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                  color: HOF.text, letterSpacing: '0.02em',
                }}>{l.name}</div>
                <div style={{
                  fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2,
                }}>{l.note}</div>
              </div>
              {l.name === 'TBA' && <HofPill tone="neutral" size="sm">Announced 6/20</HofPill>}
            </div>
          ))}
        </div>

        {/* Venue */}
        <SectionLabel>Venue</SectionLabel>
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: HOF.surface, border: `1px solid ${HOF.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ height: 140, position: 'relative', background: HOF.elevated }}>
              {/* simple stylized map */}
              <svg width="100%" height="140" viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice">
                <rect width="320" height="140" fill="#15130f"/>
                {[20, 60, 100, 140, 180, 220, 260, 300].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="140" stroke="#22201c" strokeWidth="0.5"/>
                ))}
                {[20, 50, 80, 110].map(y => (
                  <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#22201c" strokeWidth="0.5"/>
                ))}
                <path d="M0 80 L320 70" stroke="#2A2826" strokeWidth="3"/>
                <path d="M80 0 L100 140" stroke="#2A2826" strokeWidth="2"/>
                <path d="M200 0 L210 140" stroke="#2A2826" strokeWidth="2"/>
                <rect x="120" y="40" width="60" height="50" fill="#1f1d1a" stroke={HOF.amber} strokeWidth="1.5"/>
                <circle cx="150" cy="65" r="18" fill={HOF.amber} opacity="0.2"/>
                <circle cx="150" cy="65" r="6" fill={HOF.amber}/>
              </svg>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 15, color: HOF.text }}>Junkyard Social Club</div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 2 }}>2525 Pearl St, Boulder, CO 80302</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <HofButton variant="ghost" size="sm">Directions</HofButton>
                <HofButton variant="ghost" size="sm">Parking info</HofButton>
              </div>
            </div>
          </div>
        </div>

        {/* Talking about this — mini-feed from #lineup, this edition */}
        <SectionLabel>Talking about this</SectionLabel>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOF_POSTS.filter(p => p.edition === 24 && (p.channel === 'lineup' || p.channel === 'general'))
                    .slice(0, 2).map(p => (
            <FeedPost key={p.id} post={p} compact
                      onOpen={() => onOpenPost && onOpenPost(p.id)}/>
          ))}
          <button className="hof-btn hof-press"
                  onClick={() => onOpenPost && onOpenPost('community')}
                  style={{
                    padding: '12px 14px',
                    background: HOF.surface, border: `1px dashed ${HOF.border}`,
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: 'Inter', fontSize: 13, color: HOF.text,
                  }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="chat" size={16} color={HOF.amber}/>
              Open the Edition 24 thread
            </span>
            <Icon name="chev" size={14} color={HOF.textSec}/>
          </button>
        </div>

        {/* FAQ */}
        <SectionLabel>FAQ</SectionLabel>
        <div style={{ padding: '0 16px' }}>
          {faqs.map((f, i) => (
            <button key={i} className="hof-btn"
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    style={{ width: '100%', textAlign: 'left',
                             padding: '14px 0',
                             borderBottom: i < faqs.length - 1 ? `1px solid ${HOF.border}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{f.q}</div>
                <Icon name="chevDn" size={16} color={HOF.textSec}
                      style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}/>
              </div>
              {openFaq === i && (
                <div style={{
                  fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, lineHeight: 1.6,
                  marginTop: 8, textWrap: 'pretty',
                }}>{f.a}</div>
              )}
            </button>
          ))}
        </div>

        {/* Past edition footer */}
        <div style={{ padding: '28px 16px 0' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 11, color: HOF.textSec,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4,
          }}>Previously</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 20, color: HOF.text,
            letterSpacing: '-0.01em',
          }}>23 sold-out editions. Browse the archive →</div>
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      <HofBottomNav active="events" onChange={nav}/>

      <CalendarSheet open={calOpen} onClose={() => setCalOpen(false)}/>
    </HofScreen>
  );
}

function Meta({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: HOF.elevated, border: `1px solid ${HOF.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={16} color={HOF.amber}/>
      </div>
      <div>
        <div style={{
          fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>{label}</div>
        <div style={{
          fontFamily: 'Inter', fontWeight: 500, fontSize: 13, color: HOF.text, marginTop: 2,
        }}>{value}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ padding: '28px 16px 14px' }}>
      <div style={{
        fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
        letterSpacing: '0.22em', textTransform: 'uppercase',
      }}>{children}</div>
    </div>
  );
}

function TierCard({ tier, selected, onSelect }) {
  const isVip = tier.tone === 'gold';
  const isSold = tier.remaining === 0;
  return (
    <button className="hof-btn hof-press" onClick={onSelect}
            style={{
              textAlign: 'left', position: 'relative',
              padding: 16,
              background: selected ? HOF.elevated : HOF.surface,
              border: selected
                ? `2px solid ${isVip ? HOF.gold : HOF.amber}`
                : `1px solid ${isVip ? 'rgba(201,148,42,0.4)' : HOF.border}`,
              borderRadius: 12,
              opacity: isSold ? 0.5 : 1,
              cursor: isSold ? 'not-allowed' : 'pointer',
            }}>
      {isVip && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
        }}>
          <HofPill tone="gold" size="sm"><Icon name="star" size={10} color={HOF.gold}/> VIP</HofPill>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
            color: isVip ? HOF.gold : HOF.text, letterSpacing: '0.01em',
          }}>{tier.name}</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>
            {tier.sub}
          </div>
        </div>
        <div style={{
          fontFamily: 'Clash Display', fontWeight: 600, fontSize: 22,
          color: HOF.text, letterSpacing: '-0.01em', marginRight: isVip ? 60 : 0,
        }}>
          ${tier.price}
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {isSold
          ? <HofPill tone="danger" size="sm">Sold out</HofPill>
          : tier.remaining < 20
            ? <HofPill tone="warning" size="sm">Only {tier.remaining} left</HofPill>
            : <HofPill tone="success" size="sm">Available</HofPill>}
        {selected && !isSold && (
          <span style={{
            fontFamily: 'Inter', fontSize: 12, color: HOF.amber, fontWeight: 500,
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="check" size={14} color={HOF.amber}/> Selected
          </span>
        )}
      </div>
    </button>
  );
}

Object.assign(window, { ScreenEvent });
