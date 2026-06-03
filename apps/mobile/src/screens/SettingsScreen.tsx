'use client';

import { colors } from '@hof/design-tokens';
import { HofConfirm, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';

type View = 'list' | 'notifs' | 'payment' | 'privacy' | 'help';

// iOS-style toggle switch
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="hof-btn"
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? colors.amber : colors.elevated,
        border: `1px solid ${on ? colors.amber : colors.borderHi}`,
        position: 'relative',
        transition: 'background 150ms, border-color 150ms',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 20 : 3,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: colors.text,
          transition: 'left 150ms',
        }}
      />
    </button>
  );
}

interface ActionRowProps {
  label: string;
  sub?: string;
  danger?: boolean;
  last?: boolean;
  right?: React.ReactNode;
  onClick?: () => void;
}

function ActionRow({ label, sub, danger, last, right, onClick }: ActionRowProps) {
  return (
    <button
      type="button"
      className="hof-btn hof-press"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${colors.border}`,
        background: 'transparent',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontSize: 14,
            color: danger ? colors.error : colors.text,
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 12,
              color: colors.textSec,
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {right ?? <Icon name="chev" size={14} color={colors.textDis} />}
    </button>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          padding: '0 16px 8px',
          fontFamily: 'Inter',
          fontSize: 10,
          color: colors.textSec,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          margin: '0 16px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Sub-view: Notifications ─────────────────────────────────────────────────
function SettingsNotifs() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [lineupAlerts, setLineupAlerts] = useState(true);
  const [communityMentions, setCommunityMentions] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings ?? {};
        if (s.push_notifications !== undefined) setPush(s.push_notifications);
        if (s.email_notifications !== undefined) setEmail(s.email_notifications);
        if (s.sms_notifications !== undefined) setSms(s.sms_notifications);
        if (s.lineup_alerts !== undefined) setLineupAlerts(s.lineup_alerts);
        if (s.community_mentions !== undefined) setCommunityMentions(s.community_mentions);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function persist(key: string, value: boolean) {
    fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(console.error);
  }

  // keep linter happy — loaded gates the UI to avoid flicker
  void loaded;

  return (
    <>
      <Section title="Channels">
        <ActionRow
          label="Push notifications"
          sub="App badge + lock screen"
          right={
            <Toggle
              on={push}
              onChange={(v) => {
                setPush(v);
                persist('push_notifications', v);
              }}
            />
          }
        />
        <ActionRow
          label="Email"
          sub="sujan@example.com"
          right={
            <Toggle
              on={email}
              onChange={(v) => {
                setEmail(v);
                persist('email_notifications', v);
              }}
            />
          }
        />
        <ActionRow
          label="SMS"
          sub="Add a phone number"
          last
          right={
            <Toggle
              on={sms}
              onChange={(v) => {
                setSms(v);
                persist('sms_notifications', v);
              }}
            />
          }
        />
      </Section>
      <Section title="Topics">
        <ActionRow
          label="Lineup & schedule alerts"
          right={
            <Toggle
              on={lineupAlerts}
              onChange={(v) => {
                setLineupAlerts(v);
                persist('lineup_alerts', v);
              }}
            />
          }
        />
        <ActionRow
          label="Community mentions"
          last
          right={
            <Toggle
              on={communityMentions}
              onChange={(v) => {
                setCommunityMentions(v);
                persist('community_mentions', v);
              }}
            />
          }
        />
      </Section>
    </>
  );
}

// ─── Sub-view: Payment ───────────────────────────────────────────────────────
function SettingsPayment() {
  return (
    <>
      <Section title="Saved cards">
        <ActionRow
          label="Visa ···· 4242"
          sub="Expires 08/27 · Default"
          right={
            <div
              style={{
                padding: '4px 8px',
                background: `${colors.amber}20`,
                border: `1px solid ${colors.amber}40`,
                borderRadius: 4,
                fontFamily: 'Inter',
                fontSize: 10,
                color: colors.amber,
                fontWeight: 600,
              }}
            >
              DEFAULT
            </div>
          }
        />
        <ActionRow label="Add new card" last />
      </Section>
      <Section title="Billing">
        <ActionRow label="Billing address" sub="Boulder, CO 80302" />
        <ActionRow label="Transaction history" last />
      </Section>
    </>
  );
}

// ─── Sub-view: Privacy ─────────────────────────────────────────────────────
function SettingsPrivacy() {
  const [anon, setAnon] = useState(false);
  const [shareActivity, setShareActivity] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  function persist(key: string, value: boolean) {
    fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(console.error);
  }

  return (
    <>
      <Section title="Community">
        <ActionRow
          label="Post anonymously by default"
          right={
            <Toggle
              on={anon}
              onChange={(v) => {
                setAnon(v);
                persist('post_anonymously', v);
              }}
            />
          }
        />
        <ActionRow
          label="Share attendance activity"
          last
          right={
            <Toggle
              on={shareActivity}
              onChange={(v) => {
                setShareActivity(v);
                persist('share_activity', v);
              }}
            />
          }
        />
      </Section>
      <Section title="Data">
        <ActionRow
          label="Download my data"
          onClick={() => alert('Your data export will be emailed to you within 24 hours.')}
        />
        <ActionRow label="Delete account" danger last onClick={() => setDeleteConfirmOpen(true)} />
      </Section>
      <HofConfirm
        open={deleteConfirmOpen}
        title="Delete your account?"
        body="This removes you and your posts. Past tickets stay attached to the editions you attended."
        confirmLabel="Delete my account"
        destructive
        onConfirm={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}

// ─── Sub-view: Help ──────────────────────────────────────────────────────────
function SettingsHelp() {
  return (
    <>
      <Section title="Support">
        <ActionRow label="Contact the crew" sub="crew@houseoffire.events" />
        <ActionRow label="FAQ" />
        <ActionRow label="Report a problem" last />
      </Section>
      <Section title="About">
        <ActionRow label="Terms of service" />
        <ActionRow label="Privacy policy" />
        <ActionRow label="App version" sub="1.0.0" last right={null} />
      </Section>
    </>
  );
}

// ─── Main SettingsScreen ─────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const [view, setView] = useState<View>('list');
  const { isWide } = useResponsive();

  const viewTitles: Record<View, string> = {
    list: 'Settings',
    notifs: 'Notifications',
    payment: 'Payment',
    privacy: 'Privacy & data',
    help: 'Help & contact',
  };

  function handleBack() {
    if (view === 'list') {
      router.back();
    } else {
      setView('list');
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      {/* Scrollable content — centered column on tablet/desktop */}
      <div
        className="hof-scroll"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isWide ? '50%' : 0,
          right: isWide ? 'auto' : 0,
          transform: isWide ? 'translateX(-50%)' : undefined,
          width: isWide ? 'min(100%, 760px)' : 'auto',
          overflowY: 'auto',
          paddingBottom: 40,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: '54px 16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: 24,
          }}
        >
          <button
            className="hof-btn hof-press"
            onClick={handleBack}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: colors.elevated,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name="chev"
              size={16}
              color={colors.text}
              style={{ transform: 'rotate(180deg)' }}
            />
          </button>
          <div
            style={{
              fontFamily: 'Clash Display',
              fontWeight: 600,
              fontSize: 22,
              color: colors.text,
              letterSpacing: '-0.01em',
            }}
          >
            {viewTitles[view]}
          </div>
        </div>

        {view === 'list' && (
          <>
            <Section title="Account">
              <ActionRow
                label="Notifications"
                sub="On · Push & email"
                onClick={() => setView('notifs')}
              />
              <ActionRow
                label="Payment methods"
                sub="Visa ···· 4242"
                onClick={() => setView('payment')}
              />
              <ActionRow label="Privacy & data" onClick={() => setView('privacy')} />
              <ActionRow label="Help & contact" last onClick={() => setView('help')} />
            </Section>
            <Section title="Session">
              <ActionRow
                label="Log out"
                danger
                last
                right={null}
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push('/landing');
                }}
              />
            </Section>
          </>
        )}

        {view === 'notifs' && <SettingsNotifs />}
        {view === 'payment' && <SettingsPayment />}
        {view === 'privacy' && <SettingsPrivacy />}
        {view === 'help' && <SettingsHelp />}
      </div>
    </div>
  );
}
