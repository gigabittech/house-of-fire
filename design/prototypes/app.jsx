// app.jsx — Design canvas hosting all House of Fire screens

function PhoneFrame({ children, dark = true }) {
  return (
    <IOSDevice width={390} height={780} dark={dark}>
      {children}
    </IOSDevice>
  );
}

function BrowserChrome({ width = 1280, height = 800, children }) {
  return (
    <div style={{
      width, height, borderRadius: 12, overflow: 'hidden',
      background: HOF.bg,
      boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 24px 80px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 36, background: '#15130f', borderBottom: `1px solid ${HOF.border}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8,
        flexShrink: 0,
      }}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }}/>
        ))}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: HOF.elevated, border: `1px solid ${HOF.border}`, borderRadius: 6,
            padding: '4px 14px',
            fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec,
          }}>admin.houseoffire.events</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  // We use simple internal nav (state) for "linked" prototype flows.
  // Each artboard owns its own prototype state.

  // Home -> Event -> Checkout -> Ticket flow with shared state via React state hoisted to artboard
  function HomeArtboard() {
    const [screen, setScreen] = React.useState('home');
    const [postId, setPostId] = React.useState('p1');
    const openPost = (id) => {
      if (id === 'community') setScreen('community');
      else { setPostId(id); setScreen('post'); }
    };
    if (screen === 'event')     return <ScreenEvent     onBack={() => setScreen('home')}   onOpenCheckout={() => setScreen('checkout')} onOpenPost={openPost} nav={(id) => id === 'home' && setScreen('home')}/>;
    if (screen === 'checkout')  return <ScreenCheckout  onBack={() => setScreen('event')}  onComplete={() => setScreen('ticket')}/>;
    if (screen === 'ticket')    return <ScreenTicket    onBack={() => setScreen('home')}   nav={(id) => id === 'home' && setScreen('home')}/>;
    if (screen === 'community') return <ScreenCommunity onOpenPost={openPost} nav={(id) => id === 'home' ? setScreen('home') : id === 'community' && setScreen('community')}/>;
    if (screen === 'post')      return <ScreenPost      postId={postId} onBack={() => setScreen('community')}/>;
    return <ScreenHome onOpenEvent={() => setScreen('event')}
                       onOpenCheckout={() => setScreen('checkout')}
                       onOpenPost={openPost}
                       nav={(id) => {
                         if (id === 'events')    setScreen('event');
                         if (id === 'community') setScreen('community');
                         if (id === 'profile')   setScreen('ticket');
                       }}/>;
  }

  function CommunityArtboard({ startScreen = 'community', startPostId = 'p1' }) {
    const [screen, setScreen] = React.useState(startScreen);
    const [postId, setPostId] = React.useState(startPostId);
    const openPost = (id) => {
      if (id === 'community') setScreen('community');
      else { setPostId(id); setScreen('post'); }
    };
    if (screen === 'post')
      return <ScreenPost postId={postId} onBack={() => setScreen('community')}/>;
    return <ScreenCommunity onOpenPost={openPost} nav={() => {}}/>;
  }

  function ProfileArtboard({ startTab = 'overview', startSettings = null } = {}) {
    const [screen, setScreen] = React.useState(startSettings ? 'settings' : 'profile');
    const [postId, setPostId] = React.useState('p4');
    const [settingsView, setSettingsView] = React.useState(startSettings || 'list');
    if (screen === 'post')
      return <ScreenPost postId={postId} onBack={() => setScreen('profile')}/>;
    if (screen === 'settings')
      return <ScreenSettings startView={settingsView} onBack={() => setScreen('profile')}/>;
    return <ScreenProfile nav={() => {}} onOpenTicket={() => {}} startTab={startTab}
                          onOpenSettings={(v) => { setSettingsView(v); setScreen('settings'); }}
                          onOpenPost={(id) => { setPostId(id); setScreen('post'); }}/>;
  }

  function OnboardingArtboard({ step = 1 }) {
    return <ScreenOnboarding startStep={step} onComplete={() => {}} onSignIn={() => {}}/>;
  }

  function EventArtboard({ startCalOpen = false }) {
    const [screen, setScreen] = React.useState('event');
    if (screen === 'checkout') return <ScreenCheckout onBack={() => setScreen('event')} onComplete={() => setScreen('ticket')}/>;
    if (screen === 'ticket')   return <ScreenTicket   onBack={() => setScreen('event')}/>;
    return <ScreenEvent onBack={() => {}} onOpenCheckout={() => setScreen('checkout')} nav={() => {}} startCalOpen={startCalOpen}/>;
  }

  function CheckoutArtboard({ step }) {
    return <ScreenCheckout onBack={() => {}} onComplete={() => {}} startStep={step}/>;
  }

  return (
    <DesignCanvas
      title="House of Fire — PWA"
      subtitle="houseoffire.events · Mobile PWA + desktop admin · For internal review"
    >
      {/* ───────────── ENTRY ───────────── */}
      <DCSection id="entry" title="00 · Entry points" subtitle="What strangers see, and how first-timers join the house.">
        <DCArtboard id="landing" label="Unauthenticated landing" width={390} height={780}>
          <PhoneFrame dark={true}><ScreenLanding onGetStarted={() => {}} onSignIn={() => {}}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="onboard-1" label="Onboarding · Sign up" width={390} height={780}>
          <PhoneFrame><OnboardingArtboard step={1}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="onboard-2" label="Onboarding · Channels" width={390} height={780}>
          <PhoneFrame><OnboardingArtboard step={2}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="onboard-3" label="Onboarding · Welcome" width={390} height={780}>
          <PhoneFrame><OnboardingArtboard step={3}/></PhoneFrame>
        </DCArtboard>
      </DCSection>
      {/* ────────────── PRIMARY FLOWS ────────────── */}
      <DCSection id="flow" title="01 · Attendee flow" subtitle="Tap through: Home → Event → Checkout → Ticket. Each artboard is independently interactive — try them.">
        <DCArtboard id="home"     label="Home · with feed"    width={390} height={780}>
          <PhoneFrame><HomeArtboard/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="event"    label="Event detail"       width={390} height={780}>
          <PhoneFrame><EventArtboard/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="event-cal" label="Event · Add to Calendar sheet" width={390} height={780}>
          <PhoneFrame><EventArtboard startCalOpen={true}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="co-1"     label="Checkout · tickets" width={390} height={780}>
          <PhoneFrame><CheckoutArtboard step={1}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="co-2"     label="Checkout · your details" width={390} height={780}>
          <PhoneFrame><CheckoutArtboard step={2}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="co-3"     label="Checkout · payment" width={390} height={780}>
          <PhoneFrame><CheckoutArtboard step={3}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="ticket"   label="QR ticket"          width={390} height={780}>
          <PhoneFrame><ScreenTicket onBack={() => {}} nav={() => {}}/></PhoneFrame>
        </DCArtboard>
      </DCSection>

      {/* ────────────── ACCOUNT + ARCHIVE ────────────── */}
      <DCSection id="member" title="02 · Member + archive" subtitle="Profile establishes identity & tier. Archive is the photography-led history view.">
        <DCArtboard id="profile" label="Member profile"  width={390} height={780}>
          <PhoneFrame><ProfileArtboard/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="profile-posts" label="Profile · Posts tab" width={390} height={780}>
          <PhoneFrame><ProfileArtboard startTab="posts"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="archive" label="The Archive"     width={390} height={780}>
          <PhoneFrame><ScreenArchive nav={() => {}}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="archive-upload" label="Archive · photo submit" width={390} height={780}>
          <PhoneFrame><ScreenArchive nav={() => {}} startUploadOpen={true}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="ticket-transfer" label="Ticket · Transfer sheet" width={390} height={780}>
          <PhoneFrame><ScreenTicket nav={() => {}} startTransferOpen={true}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="ticket-refund" label="Ticket · Refund sheet" width={390} height={780}>
          <PhoneFrame><ScreenTicket nav={() => {}} startRefundOpen={true}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="settings" label="Settings · list" width={390} height={780}>
          <PhoneFrame><ProfileArtboard startSettings="list"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="settings-notifs" label="Settings · Notifications" width={390} height={780}>
          <PhoneFrame><ProfileArtboard startSettings="notifs"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="settings-payment" label="Settings · Payment" width={390} height={780}>
          <PhoneFrame><ProfileArtboard startSettings="payment"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="settings-privacy" label="Settings · Privacy" width={390} height={780}>
          <PhoneFrame><ProfileArtboard startSettings="privacy"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="settings-help" label="Settings · Help" width={390} height={780}>
          <PhoneFrame><ProfileArtboard startSettings="help"/></PhoneFrame>
        </DCArtboard>
      </DCSection>

      <DCSection id="community" title="02b · Community board" subtitle="The discussion product. Channels, threads, composer, notifications. Tap any post to open the full thread.">
        <DCArtboard id="community-general" label="Community · #general" width={390} height={780}>
          <PhoneFrame><CommunityArtboard/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="community-lineup" label="Community · #lineup" width={390} height={780}>
          <PhoneFrame><ScreenCommunity nav={() => {}} startChannel="lineup" onOpenPost={() => {}}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="community-help-empty" label="Channel · empty state" width={390} height={780}>
          <PhoneFrame><ScreenCommunity nav={() => {}} startChannel="help" onOpenPost={() => {}}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="post-detail" label="Post detail · announcement" width={390} height={780}>
          <PhoneFrame><CommunityArtboard startScreen="post" startPostId="p1"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="post-recap" label="Post detail · recap collage" width={390} height={780}>
          <PhoneFrame><CommunityArtboard startScreen="post" startPostId="p2"/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="composer" label="Composer · new post" width={390} height={780}>
          <PhoneFrame><ScreenCommunity nav={() => {}} startComposerOpen={true} startChannel="lineup" onOpenPost={() => {}}/></PhoneFrame>
        </DCArtboard>
      </DCSection>

      {/* ────────────── ADMIN ────────────── */}
      <DCSection id="admin" title="03 · Admin console (desktop)" subtitle="Jordan's view. Same dark palette, denser layout, ops-focused. Designed for laptop primary.">
        <DCArtboard id="admin-dash" label="Dashboard · event ops" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-door" label="Door · live (walk-up sales + QR)" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="door"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-door-modal" label="Door · Sell at the door modal" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="door" doorModalOpen={true}/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-announce" label="Announcements · compose" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="announce"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-mod" label="Moderation · reports + queue" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="mod"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-events" label="Events · all themes" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="events"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-members" label="Members · directory" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="members"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-codes" label="Codes & comps" width={1280} height={800}>
          <BrowserChrome width={1280} height={800}>
            <ScreenAdmin startView="codes"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="admin-financials" label="Financials" width={1280} height={900}>
          <BrowserChrome width={1280} height={900}>
            <ScreenAdmin startView="financials"/>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="door-mobile" label="Door · bouncer (mobile)" width={390} height={780}>
          <PhoneFrame><ScreenDoorMobile/></PhoneFrame>
        </DCArtboard>
      </DCSection>

      {/* ─────────────── BRAND ARTIFACTS ─────────────── */}
      <DCSection id="brand" title="05 · Brand artifacts" subtitle="Designed pieces that extend the brand beyond the app — wallet passes, emails, push notifications.">
        <DCArtboard id="wallet-apple" label="Apple Wallet pass" width={420} height={620}>
          <div style={{ background: HOF.bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WalletPassApple/>
          </div>
        </DCArtboard>
        <DCArtboard id="wallet-google" label="Google Wallet pass" width={420} height={620}>
          <div style={{ background: HOF.bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WalletPassGoogle/>
          </div>
        </DCArtboard>
        <DCArtboard id="apple-watch" label="Apple Watch · ticket face" width={420} height={620}>
          <div style={{ background: HOF.bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppleWatchTicket/>
          </div>
        </DCArtboard>
        <DCArtboard id="print-receipt" label="Print · receipt (US Letter)" width={680} height={900}>
          <div style={{ background: '#e8e6df', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <PrintReceipt/>
          </div>
        </DCArtboard>
        <DCArtboard id="email-smoke" label="Email · Smoke Signal newsletter" width={680} height={1100}>
          <BrowserChrome width={680} height={1100}>
            <div style={{ background: '#e8e6df', minHeight: '100%', padding: 24, display: 'flex', justifyContent: 'center' }}>
              <EmailSmokeSignal/>
            </div>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="email-receipt" label="Email · Ticket receipt" width={680} height={1100}>
          <BrowserChrome width={680} height={1100}>
            <div style={{ background: '#e8e6df', minHeight: '100%', padding: 24, display: 'flex', justifyContent: 'center' }}>
              <EmailReceipt/>
            </div>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="email-reply" label="Email · Reply notification" width={680} height={760}>
          <BrowserChrome width={680} height={760}>
            <div style={{ background: '#e8e6df', minHeight: '100%', padding: 24, display: 'flex', justifyContent: 'center' }}>
              <EmailReply/>
            </div>
          </BrowserChrome>
        </DCArtboard>
        <DCArtboard id="push-lock" label="Push · iOS lockscreen" width={420} height={720}>
          <div style={{ background: HOF.bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PushIosLockscreen/>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────────── DAY-OF & STATES ─────────────── */}
      <DCSection id="states" title="06 · Day-of & system states" subtitle="The live-night Home variant, loading/empty/error states, toasts, share sheet, and the real venue map treatment.">
        <DCArtboard id="live-night" label="Home · Doors are open (day-of)" width={390} height={780}>
          <PhoneFrame><ScreenLiveNight nav={() => {}} onOpenTicket={() => {}}/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="map-sheet" label="Map · Junkyard Social Club" width={390} height={780}>
          <PhoneFrame><MapWrapper/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="share-sheet" label="Share & refer" width={390} height={780}>
          <PhoneFrame><ShareWrapper/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="states-loading" label="Feed · loading skeleton" width={390} height={780}>
          <PhoneFrame><LoadingDemo/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="states-empty-error" label="Empty + error states" width={620} height={760}>
          <StatesDemo/>
        </DCArtboard>
        <DCArtboard id="states-toasts" label="Toasts + confirm modal" width={620} height={760}>
          <ToastsDemo/>
        </DCArtboard>
      </DCSection>

      {/* ─────────────── TABLET + UPGRADE ─────────────── */}
      <DCSection id="tablet" title="07 · Tablet + tier upgrade" subtitle="iPad-sized split-pane layout for members. VIP upgrade sheet for mid-flight conversions.">
        <DCArtboard id="ipad" label="iPad · split-pane home" width={1180} height={820}>
          <IpadFrame width={1180} height={820}>
            <ScreenTablet/>
          </IpadFrame>
        </DCArtboard>
        <DCArtboard id="upgrade" label="VIP upgrade · sheet" width={390} height={780}>
          <PhoneFrame><UpgradeWrapper/></PhoneFrame>
        </DCArtboard>
      </DCSection>

      {/* ─────────────── DESIGN SYSTEM ─────────────── */}
      <DCSection id="ds" title="04 · System reference" subtitle="Tokens, typography, components — the substrate the rest of the work is built on.">
        <DCArtboard id="ds-color" label="Color · palette"    width={620} height={680}>
          <ColorSheet/>
        </DCArtboard>
        <DCArtboard id="ds-type"  label="Type · specimen"    width={620} height={680}>
          <TypeSheet/>
        </DCArtboard>
        <DCArtboard id="ds-comp"  label="Components"         width={620} height={780}>
          <ComponentSheet/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

// ─── System reference sheets ────────────────────────────────────────────────
function ColorSheet() {
  const groups = [
    { name: 'Surface', colors: [
      ['Background', HOF.bg, '#0A0A08'],
      ['Surface', HOF.surface, '#141412'],
      ['Elevated', HOF.elevated, '#1E1C19'],
      ['Border', HOF.border, '#2A2826'],
    ]},
    { name: 'Fire', colors: [
      ['Amber · primary', HOF.amber, '#E8651A'],
      ['Ember · contrast', HOF.ember, '#C4401A'],
      ['Glow · hover', HOF.glow, '#F5942A'],
      ['Gold · VIP', HOF.gold, '#C9942A'],
    ]},
    { name: 'Text', colors: [
      ['Text primary', HOF.text, '#F0EDE6'],
      ['Text secondary', HOF.textSec, '#8A8880'],
      ['Text disabled', HOF.textDis, '#4A4844'],
    ]},
    { name: 'Status', colors: [
      ['Success', HOF.success, '#4CAF6E'],
      ['Warning', HOF.warning, '#E8A21A'],
      ['Error', HOF.error, '#E84A1A'],
      ['Info', HOF.info, '#4A8AE8'],
    ]},
  ];
  return (
    <div style={{ background: HOF.bg, color: HOF.text, padding: 28, height: '100%',
                  fontFamily: 'Inter', overflow: 'auto' }} className="hof-scroll">
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 28, letterSpacing: '-0.01em',
      }}>Color</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
        Dark theme only. Background is almost always #0A0A08. Amber lives sparingly — at the energy points.
      </div>
      {groups.map(g => (
        <div key={g.name} style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10,
          }}>{g.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {g.colors.map(([n, c, hex]) => (
              <div key={n} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 6, background: c,
                  border: c === HOF.bg ? `1px solid ${HOF.border}` : 'none', flexShrink: 0,
                }}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 12, color: HOF.text }}>{n}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: HOF.textSec }}>{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeSheet() {
  const styles = [
    ['Display XL',  'Clash Display 600', 48, 'House of Fire', '-0.02em'],
    ['Display L',   'Clash Display 600', 36, 'Fireversary', '-0.02em'],
    ['Heading L',   'Clash Display 600', 24, 'What to expect', '-0.01em'],
    ['Heading M',   'Inter 500',         20, 'Card titles, tier names', 0],
    ['Heading S',   'Inter 500',         16, 'Sub-section labels', 0],
    ['Body',        'Inter 400',         15, 'Selling fast. 47 left.', 0],
    ['Body S',      'Inter 400',         13, 'Doors at 9. Don\'t be late.', 0],
    ['Caption',     'Inter 500',         11, 'TONIGHT · 9 PM', '0.18em', true],
    ['Mono',        'JetBrains Mono',    13, 'HOF—24—4218', '0.16em'],
  ];
  return (
    <div style={{ background: HOF.bg, color: HOF.text, padding: 28, height: '100%',
                  fontFamily: 'Inter', overflow: 'auto' }} className="hof-scroll">
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 28, letterSpacing: '-0.01em',
      }}>Type</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
        Two faces: <span style={{ color: HOF.text }}>Clash Display</span> for everything that should feel like an album title; <span style={{ color: HOF.text }}>Inter</span> for everything else.
      </div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {styles.map(([name, spec, size, sample, ls, caps]) => (
          <div key={name} style={{
            display: 'grid', gridTemplateColumns: '140px 1fr',
            gap: 24, paddingBottom: 16, borderBottom: `1px solid ${HOF.border}`,
          }}>
            <div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 500, color: HOF.text }}>{name}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textSec, marginTop: 2 }}>{spec}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.textSec }}>{size}px</div>
            </div>
            <div style={{
              fontFamily: spec.startsWith('Clash') ? 'Clash Display'
                        : spec.startsWith('Inter') ? 'Inter'
                        : 'JetBrains Mono',
              fontWeight: spec.includes('600') ? 600 : spec.includes('500') ? 500 : 400,
              fontSize: size, color: HOF.text, letterSpacing: ls, lineHeight: 1.1,
              textTransform: caps ? 'uppercase' : 'none',
            }}>{sample}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentSheet() {
  return (
    <div style={{ background: HOF.bg, color: HOF.text, padding: 28, height: '100%',
                  fontFamily: 'Inter', overflow: 'auto' }} className="hof-scroll">
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 28, letterSpacing: '-0.01em',
      }}>Components</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
        The building blocks. All states on dark.
      </div>

      <SheetLabel>Buttons</SheetLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <HofButton variant="primary">Get Tickets</HofButton>
        <HofButton variant="ghost">Event details</HofButton>
        <HofButton variant="gold" icon={<Icon name="star" size={14} color={HOF.bg}/>}>VIP access</HofButton>
        <HofButton variant="quiet">Quiet</HofButton>
        <HofButton variant="danger">Refund</HofButton>
        <HofButton variant="primary" disabled>Disabled</HofButton>
      </div>

      <SheetLabel>Pills + badges</SheetLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <HofPill tone="amber">Selling fast</HofPill>
        <HofPill tone="warning">47 left</HofPill>
        <HofPill tone="success">Available</HofPill>
        <HofPill tone="danger">Sold out</HofPill>
        <HofPill tone="gold"><Icon name="star" size={10} color={HOF.gold}/> VIP</HofPill>
        <HofPill tone="crew">Crew</HofPill>
        <HofPill tone="neutral">Coming soon</HofPill>
      </div>

      <SheetLabel>Inputs</SheetLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
        <input placeholder="Default" style={{
          height: 48, padding: '0 14px', background: HOF.surface,
          border: `1px solid ${HOF.border}`, borderRadius: 8,
          fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
        }}/>
        <input defaultValue="you@example.com" style={{
          height: 48, padding: '0 14px', background: HOF.surface,
          border: `1px solid ${HOF.amber}`, borderRadius: 8,
          fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
        }}/>
        <div>
          <input defaultValue="not-an-email" style={{
            width: '100%', boxSizing: 'border-box',
            height: 48, padding: '0 14px', background: HOF.surface,
            border: `1px solid ${HOF.error}`, borderRadius: 8,
            fontFamily: 'Inter', fontSize: 14, color: HOF.text, outline: 'none',
          }}/>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.error, marginTop: 6 }}>
            That doesn't look like an email — try again.
          </div>
        </div>
      </div>

      <SheetLabel>Icons (Phosphor-style)</SheetLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 10, maxWidth: 480,
      }}>
        {['home','calendar','users','user','clock','pin','star','ticket','share','download',
          'wallet','camera','image','flame','search','settings','bell','bolt','music','qr'
        ].map(n => (
          <div key={n} style={{
            width: 36, height: 36, borderRadius: 8,
            background: HOF.surface, border: `1px solid ${HOF.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={n} size={18} color={HOF.textSec}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function SheetLabel({ children }) {
  return <div style={{
    margin: '28px 0 12px',
    fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
    letterSpacing: '0.22em', textTransform: 'uppercase',
  }}>{children}</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

// ─── Demo wrappers for Day-of & states section ──────────────────────────────
function MapWrapper() {
  return (
    <HofScreen>
      <MapSheet open={true} onClose={() => {}}/>
    </HofScreen>
  );
}

function ShareWrapper() {
  return (
    <HofScreen>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(232,101,26,0.10), transparent 60%), #0A0A08',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '120px 24px',
      }}>
        <div style={{
          fontFamily: 'Inter', fontSize: 13, color: HOF.textSec, textAlign: 'center', maxWidth: 240,
          lineHeight: 1.5,
        }}>
          Triggered from the Ticket screen's <span style={{ color: HOF.amber }}>Tell a friend</span> card or from any Event detail.
        </div>
      </div>
      <ShareSheet open={true} onClose={() => {}}/>
    </HofScreen>
  );
}

function LoadingDemo() {
  return (
    <HofScreen>
      <div style={{ height: 54 }}/>
      <div style={{
        padding: '14px 16px 8px',
        fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
        letterSpacing: '0.22em', textTransform: 'uppercase',
      }}>From the house · loading</div>
      <div style={{
        padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <FeedSkeletonCard/>
        <FeedSkeletonCard/>
        <FeedSkeletonCard/>
      </div>
      <HofBottomNav active="home"/>
    </HofScreen>
  );
}

function StatesDemo() {
  return (
    <div style={{
      background: HOF.bg, color: HOF.text, padding: 28, height: '100%',
      fontFamily: 'Inter', overflow: 'auto',
    }} className="hof-scroll">
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26, letterSpacing: '-0.01em',
      }}>Empty + Error</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
        Same anatomy, different feeling. Amber for "this is fine, do a thing." Red for "something broke."
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 14,
        }}>
          <EmptyState
            icon="ticket"
            title="No tickets yet"
            body="Your first ticket lands here once you check out. The room fills fast — we'll let you know."
            action={<HofButton variant="primary" icon={<Icon name="flame" size={14} color={HOF.bg}/>}>Browse events</HofButton>}/>
        </div>
        <div style={{
          background: HOF.surface, border: `1px solid ${HOF.border}`, borderRadius: 14,
        }}>
          <ErrorState
            title="The feed didn't load"
            body="Your connection dropped. Try once more — if it still fails, the crew knows."
            retry={() => {}}/>
        </div>
      </div>
    </div>
  );
}

function ToastsDemo() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  return (
    <div style={{
      background: HOF.bg, color: HOF.text, padding: 28, height: '100%',
      fontFamily: 'Inter', overflow: 'auto', position: 'relative',
    }} className="hof-scroll">
      <div style={{
        fontFamily: 'Clash Display', fontWeight: 600, fontSize: 26, letterSpacing: '-0.01em',
      }}>Toasts + Confirm</div>
      <div style={{ fontFamily: 'Inter', fontSize: 12, color: HOF.textSec, marginTop: 4 }}>
        One toast vocabulary across the platform. Use sparingly — never for anything reversible-by-itself.
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <HofToast kind="success" onDismiss={() => {}}>Ticket transferred to Devon — they have 24h to accept.</HofToast>
        <HofToast kind="info"    onDismiss={() => {}}>Your post is in #general. 12 members see it now.</HofToast>
        <HofToast kind="warn"    onDismiss={() => {}}>Theme 24 sells out in ~6 days at this pace.</HofToast>
        <HofToast kind="error"   onDismiss={() => {}}>Couldn't charge that card. Try a different one?</HofToast>
      </div>

      <div style={{ marginTop: 32 }}>
        <HofButton variant="danger" onClick={() => setConfirmOpen(true)}>
          Trigger confirm modal
        </HofButton>
      </div>

      <HofConfirm
        open={confirmOpen}
        title="Delete your account?"
        body="This removes you and your posts. Past tickets stay attached to the themes you attended."
        confirmLabel="Delete my account"
        destructive
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}/>
    </div>
  );
}


// ─── iPad frame ─────────────────────────────────────────────────────────────
function IpadFrame({ width = 1180, height = 820, children }) {
  return (
    <div style={{
      width, height, position: 'relative',
      background: '#222', borderRadius: 28, padding: 14,
      boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 0 0 2px #2a2a2a',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 18, overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {/* Camera notch */}
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          width: 8, height: 8, borderRadius: 4, background: '#000',
          boxShadow: 'inset 0 0 0 1.5px #333',
        }}/>
        {children}
      </div>
    </div>
  );
}

// ─── Upgrade wrapper (shows the UpgradeSheet open in a phone frame) ────────
function UpgradeWrapper() {
  return (
    <HofScreen>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 40%, rgba(201,148,42,0.12), transparent 70%), #0A0A08',
      }}/>
      <UpgradeSheet open={true} onClose={() => {}}/>
    </HofScreen>
  );
}
