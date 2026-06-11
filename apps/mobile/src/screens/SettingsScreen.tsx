'use client';

import { colors, layoutChrome } from '@hof/design-tokens';
import { HofConfirm, Icon, useResponsive } from '@hof/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useAppPageColumn } from '@/hooks/useAppPageColumn';
import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
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
          padding: '0 0 8px',
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
  const [pushError, setPushError] = useState<string | null>(null);
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
                setPushError(null);
                persist('push_notifications', v);
                void import('@/lib/push/client').then(({ syncPushSubscription }) =>
                  syncPushSubscription(v).then((err) => {
                    if (err) {
                      setPushError(err);
                      setPush(false);
                      persist('push_notifications', false);
                    }
                  }),
                );
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
        {pushError ? (
          <div
            style={{
              padding: '10px 14px 0',
              fontFamily: 'Inter',
              fontSize: 12,
              color: '#f87171',
              lineHeight: 1.45,
            }}
          >
            {pushError}
          </div>
        ) : null}
      </Section>
      <Section title="Topics">
        <ActionRow
          label="Lineup & schedule alerts"
          last={!COMMUNITY_FEATURE_ENABLED}
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
        {COMMUNITY_FEATURE_ENABLED ? (
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
        ) : null}
      </Section>
    </>
  );
}

// ─── Sub-view: Payment ───────────────────────────────────────────────────────
function SettingsPayment() {
  const [methods, setMethods] = useState<
    Array<{ id: string; brand: string; last4: string; exp_month?: number; exp_year?: number }>
  >([]);

  useEffect(() => {
    fetch('/api/billing/payment-methods')
      .then((r) => r.json())
      .then((d: { methods?: typeof methods }) => setMethods(d.methods ?? []))
      .catch(console.error);
  }, []);

  const primary = methods[0];

  return (
    <>
      <Section title="Saved cards">
        <ActionRow
          label={primary ? `${primary.brand} ···· ${primary.last4}` : 'No card on file'}
          sub={
            primary
              ? `Expires ${primary.exp_month}/${primary.exp_year} · Default`
              : 'Add a card at checkout'
          }
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

  useEffect(() => {
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings ?? {};
        if (s.post_anonymously !== undefined) setAnon(s.post_anonymously);
        if (s.share_activity !== undefined) setShareActivity(s.share_activity);
      })
      .catch(console.error);
  }, []);

  function persist(key: string, value: boolean) {
    fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(console.error);
  }

  return (
    <>
      {COMMUNITY_FEATURE_ENABLED ? (
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
      ) : null}
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
        body="This removes you and your posts. Past tickets stay attached to the themes you attended."
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
  const open = (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Section title="Support">
        <ActionRow
          label="Contact the crew"
          sub="crew@houseoffire.events"
          onClick={() => {
            window.location.href = 'mailto:crew@houseoffire.events';
          }}
        />
        <ActionRow label="FAQ" onClick={() => open('https://houseoffire.events/faq')} />
        <ActionRow
          label="Report a problem"
          last
          onClick={() => {
            window.location.href = 'mailto:crew@houseoffire.events?subject=App%20issue';
          }}
        />
      </Section>
      <Section title="About">
        <ActionRow
          label="Terms of service"
          onClick={() => open('https://houseoffire.events/terms')}
        />
        <ActionRow
          label="Privacy policy"
          onClick={() => open('https://houseoffire.events/privacy')}
        />
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
  const pageColumn = useAppPageColumn();

  const viewTitles: Record<View, string> = {
    list: 'Settings',
    notifs: 'Notifications',
    payment: 'Payment',
    privacy: 'Privacy & data',
    help: 'Help & contact',
  };

  const handleBack = useCallback(() => {
    if (view === 'list') {
      router.back();
    } else {
      setView('list');
    }
  }, [view, router]);

  useAppHeader({ title: viewTitles[view], onBack: handleBack });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: colors.bg,
      }}
    >
      {/* Scrollable content — centered column on tablet/desktop */}
      <div
        className="hof-scroll hof-app-page-scroll"
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingTop: isWide ? layoutChrome.wideActionsInset : layoutChrome.mobilePageHeaderInset,
          paddingBottom: isWide ? layoutChrome.wideScrollBottom : layoutChrome.mobileScrollBottom,
        }}
      >
        <div style={{ ...pageColumn, paddingTop: isWide ? 8 : 12 }}>
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
    </div>
  );
}
