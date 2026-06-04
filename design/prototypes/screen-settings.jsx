// screen-settings.jsx — Settings detail screens (notifications, payment, privacy, help)

function ScreenSettings({ startView = 'list', onBack }) {
  const [view, setView] = React.useState(startView);

  return (
    <HofScreen>
      <HofTopBar title={titleFor(view)} onBack={view === 'list' ? onBack : () => setView('list')}/>

      <HofScroll>
        <div style={{ height: 102 }}/>
        {view === 'list'    && <SettingsList     onOpen={setView}/>}
        {view === 'notifs'  && <SettingsNotifs/>}
        {view === 'payment' && <SettingsPayment/>}
        {view === 'privacy' && <SettingsPrivacy/>}
        {view === 'help'    && <SettingsHelp/>}
        <HofHomeSpacer/>
      </HofScroll>
    </HofScreen>
  );
}

function titleFor(v) {
  return ({ list: 'Settings', notifs: 'Notifications', payment: 'Payment methods',
            privacy: 'Privacy & data', help: 'Help & contact' })[v];
}

function SettingsList({ onOpen }) {
  const items = [
    ['notifs',  'bell',     'Notifications',  'Push, email, SMS'],
    ['payment', 'wallet',   'Payment methods', 'Visa ···· 4242'],
    ['privacy', 'settings', 'Privacy & data', 'Photo visibility, data export'],
    ['help',    'chat',     'Help & contact',  'Reach the crew'],
  ];
  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{
        background: HOF.surface, border: `1px solid ${HOF.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {items.map(([k, ic, t, s], i, a) => (
          <button key={k} className="hof-btn hof-press" onClick={() => onOpen(k)}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    borderBottom: i < a.length - 1 ? `1px solid ${HOF.border}` : 'none',
                  }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: HOF.elevated, border: `1px solid ${HOF.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name={ic} size={18} color={HOF.text}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{t}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>{s}</div>
            </div>
            <Icon name="chev" size={14} color={HOF.textSec}/>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="hof-btn hof-press"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
                  fontFamily: 'Inter', fontSize: 14, color: HOF.error, fontWeight: 500,
                }}>
          Log out
        </button>
      </div>
    </div>
  );
}

function SettingsNotifs() {
  const [s, setS] = React.useState({
    push_ticket: true, push_replies: true, push_recap: true, push_general: false,
    email_smoke: true, email_receipts: true,
    sms_day: true, sms_drop: false,
  });
  const t = (k) => () => setS(p => ({ ...p, [k]: !p[k] }));

  return (
    <div style={{ padding: '8px 16px' }}>
      <Section title="Push">
        <Toggle on={s.push_ticket}  onChange={t('push_ticket')}  label="Your ticket events" sub="Doors open, your group at the door, transfer accepted."/>
        <Toggle on={s.push_replies} onChange={t('push_replies')} label="Replies to your posts" sub="Plus reactions over 10."/>
        <Toggle on={s.push_recap}   onChange={t('push_recap')}   label="Recap photos" sub="Once per theme, after photos are reviewed."/>
        <Toggle on={s.push_general} onChange={t('push_general')} label="#general announcements" sub="Crew posts only. We post 2–4 times a month."/>
      </Section>
      <Section title="Email">
        <Toggle on={s.email_smoke}    onChange={t('email_smoke')}    label="Smoke Signal newsletter" sub="One short message before each theme."/>
        <Toggle on={s.email_receipts} onChange={t('email_receipts')} label="Tickets & receipts" sub="Always on for your records."/>
      </Section>
      <Section title="SMS">
        <Toggle on={s.sms_day}  onChange={t('sms_day')}  label="Day-of reminder" sub="Doors at 9. Don't forget your QR."/>
        <Toggle on={s.sms_drop} onChange={t('sms_drop')} label="When tickets drop" sub="60 seconds before public, member-first."/>
      </Section>
    </div>
  );
}

function SettingsPayment() {
  const cards = [
    { brand: 'Visa',       last4: '4242', exp: '12/28', default: true },
    { brand: 'Mastercard', last4: '8019', exp: '03/27', default: false },
  ];
  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{
        fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
        letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
      }}>Saved cards</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.map(c => (
          <div key={c.last4} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 12,
          }}>
            <div style={{
              width: 42, height: 28, borderRadius: 4,
              background: c.brand === 'Visa'
                ? '#1A1F71'
                : 'linear-gradient(90deg, #EB001B 50%, #F79E1B 50%)',
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text,
              }}>
                {c.brand} ···· {c.last4}
                {c.default && <HofPill tone="amber" size="sm">Default</HofPill>}
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec, marginTop: 2,
              }}>Exp {c.exp}</div>
            </div>
            <Icon name="chev" size={14} color={HOF.textSec}/>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <HofButton variant="ghost" full icon={<Icon name="plus" size={14} color={HOF.text}/>}>
          Add a new card
        </HofButton>
      </div>

      <div style={{
        marginTop: 22, padding: 14,
        background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Icon name="check" size={16} color={HOF.success}/>
        <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, lineHeight: 1.5 }}>
          Cards stored securely by Stripe. We never see your full card number.
        </div>
      </div>
    </div>
  );
}

function SettingsPrivacy() {
  const [vis, setVis] = React.useState({ tagging: true, dm: false, profile: 'members' });
  return (
    <div style={{ padding: '8px 16px' }}>
      <Section title="Photo visibility">
        <Toggle on={vis.tagging} onChange={() => setVis(v => ({ ...v, tagging: !v.tagging }))}
                label="Let others tag me in recap photos" sub="Only members can tag. Off → photos still public, just untagged."/>
      </Section>
      <Section title="Messages">
        <Toggle on={vis.dm} onChange={() => setVis(v => ({ ...v, dm: !v.dm }))}
                label="Allow DMs from other members" sub="You can always DM Crew."/>
      </Section>
      <Section title="Profile visibility">
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          {[['public', 'Public', 'Anyone, including non-members.'],
            ['members', 'Members only', 'Only people with a House of Fire account.'],
            ['private', 'Just me', 'Hidden everywhere except your tickets.']].map(([k, t, s], i, a) => (
            <button key={k} className="hof-btn" onClick={() => setVis(v => ({ ...v, profile: k }))}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: i < a.length - 1 ? `1px solid ${HOF.border}` : 'none',
                    }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9, flexShrink: 0,
                border: `1.5px solid ${vis.profile === k ? HOF.amber : HOF.borderHi}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {vis.profile === k && <div style={{ width: 8, height: 8, borderRadius: 4, background: HOF.amber }}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter', fontSize: 14, color: HOF.text, fontWeight: 500 }}>{t}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2 }}>{s}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Data">
        <ActionRow label="Download my data" sub="JSON export — tickets, posts, photos."/>
        <ActionRow label="Delete my account" sub="Removes you and your posts. Past tickets stay attached to the themes you attended." destructive/>
      </Section>
    </div>
  );
}

function SettingsHelp() {
  return (
    <div style={{ padding: '8px 16px' }}>
      <Section title="Reach the crew">
        <ActionRow label="Text the crew" sub="(303) 555-0124 · We respond same day during theme weeks."/>
        <ActionRow label="Email the crew" sub="crew@houseoffire.events"/>
        <ActionRow label="Open a help post" sub="In #help — fastest path for non-urgent questions."/>
      </Section>
      <Section title="Common questions">
        {[
          ['Where do I get in?', 'Side entrance on 23rd Street. Orange light.'],
          ['I lost my ticket — can I still get in?', 'Yes. Show ID at the door, we look you up.'],
          ['Can I transfer my ticket?', 'Yes, up to 24h before doors. Go to your ticket → Transfer.'],
          ['Refunds?', 'Tickets are non-refundable but transferable. We make exceptions for emergencies — text the crew.'],
        ].map(([q, a]) => (
          <details key={q} style={{
            padding: '14px 16px',
            background: HOF.surface, border: `1px solid ${HOF.border}`,
            borderRadius: 10, marginBottom: 8,
          }}>
            <summary style={{
              cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text,
              listStyle: 'none',
            }}>{q}</summary>
            <div style={{
              fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, marginTop: 8, lineHeight: 1.5,
            }}>{a}</div>
          </details>
        ))}
      </Section>
    </div>
  );
}

// ─── Atoms ──────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontFamily: 'Inter', fontSize: 10, color: HOF.textSec,
        letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
      }}>{title}</div>
      <div style={{
        background: HOF.surface, border: `1px solid ${HOF.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label, sub }) {
  return (
    <button type="button" className="hof-btn hof-press" onClick={onChange}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              borderBottom: `1px solid ${HOF.border}`,
            }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 14, color: HOF.text }}>{label}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
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
    </button>
  );
}

function ActionRow({ label, sub, destructive }) {
  return (
    <button className="hof-btn hof-press" style={{
      width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: `1px solid ${HOF.border}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Inter', fontWeight: 500, fontSize: 14,
          color: destructive ? HOF.error : HOF.text,
        }}>{label}</div>
        {sub && <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <Icon name="chev" size={14} color={HOF.textSec}/>
    </button>
  );
}

Object.assign(window, { ScreenSettings });
