'use client';

import { useState } from 'react';
import { Pill } from '@/components/Pill';

type PostStatus = 'idle' | 'sending' | 'success' | 'error';

interface HistoryItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  meta: string;
  stats: string;
  tone: 'amber' | 'neutral';
}

const HISTORY: HistoryItem[] = [
  {
    id: 'h1',
    kind: 'announcement',
    title: 'Edition 24 lineup is final',
    body: 'Headliner reveal: HEX. Doors 8 PM sharp — we open the floor at 9.',
    meta: 'Jordan · yesterday',
    stats: '52 🔥 · 7 replies',
    tone: 'amber',
  },
  {
    id: 'h2',
    kind: 'recap',
    title: 'Edition 23 recap is up',
    body: '127 photos from the night. Tag yourself.',
    meta: 'Crew · 3 days ago',
    stats: '184 🔥 · 21 replies',
    tone: 'amber',
  },
  {
    id: 'h3',
    kind: 'quick',
    title: 'Coat check is $3 cash tonight',
    body: "See you at 9. Don't be late.",
    meta: 'Jordan · last week',
    stats: '12 🔥 · 3 replies',
    tone: 'neutral',
  },
];

interface ChannelToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  sub: string;
  recommended?: boolean;
}

function ChannelToggle({ on, onChange, title, sub, recommended = false }: ChannelToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        background: on ? 'var(--hof-elevated)' : 'var(--hof-bg)',
        border: on ? '1px solid var(--hof-amber)' : '1px solid var(--hof-border)',
        borderRadius: 10,
        cursor: 'pointer',
      }}
    >
      {/* Toggle pill */}
      <div
        style={{
          width: 34,
          height: 20,
          borderRadius: 10,
          flexShrink: 0,
          background: on ? 'var(--hof-amber)' : 'var(--hof-border)',
          position: 'relative',
          transition: 'background 120ms',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 16 : 2,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: '#fff',
            transition: 'left 120ms ease-out',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'Inter, system-ui',
              fontWeight: 500,
              fontSize: 13,
              color: 'var(--hof-text)',
            }}
          >
            {title}
          </span>
          {recommended && (
            <Pill tone="amber" size="sm">
              Default
            </Pill>
          )}
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 11,
            color: 'var(--hof-text-sec)',
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}

export default function AnnouncePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [postTo, setPostTo] = useState({ feed: true, email: false, sms: false });
  const [status, setStatus] = useState<PostStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const canPublish = title.trim().length > 0 && body.trim().length > 0 && status !== 'sending';

  async function handlePublish() {
    if (!canPublish) return;
    setStatus('sending');
    setStatusMsg('');
    try {
      const res = await fetch('/api/admin/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), channel: 'general' }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus('error');
        setStatusMsg(json.error ?? 'Publish failed');
      } else {
        setStatus('success');
        setStatusMsg('Posted to feed.');
        setTitle('');
        setBody('');
        setPhotoAttached(false);
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setStatusMsg('Network error — try again.');
    }
  }

  return (
    <>
      <div
        style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid var(--hof-border)',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 10,
            color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          Announcements
        </div>
        <div
          style={{
            fontFamily: 'Clash Display, system-ui',
            fontWeight: 600,
            fontSize: 26,
            color: 'var(--hof-text)',
            letterSpacing: '-0.01em',
            marginTop: 4,
          }}
        >
          Talk to the house
        </div>
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-text-sec)',
            marginTop: 4,
          }}
        >
          What you post here lands on every member's home feed.
        </div>
      </div>

      <div
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 16,
        }}
      >
        {/* Compose card */}
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-amber)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            New post
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Lineup announced)"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 48,
              padding: '0 14px',
              background: 'var(--hof-bg)',
              border: '1px solid var(--hof-border)',
              borderRadius: 8,
              fontFamily: 'Clash Display, system-ui',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--hof-text)',
              outline: 'none',
              letterSpacing: '-0.01em',
            }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's the message? Keep it short — like a friend texting the group chat."
            rows={5}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              marginTop: 10,
              padding: 14,
              resize: 'vertical',
              background: 'var(--hof-bg)',
              border: '1px solid var(--hof-border)',
              borderRadius: 8,
              fontFamily: 'Inter, system-ui',
              fontSize: 14,
              color: 'var(--hof-text)',
              outline: 'none',
              lineHeight: 1.5,
            }}
          />

          {/* Photo slot */}
          <div style={{ marginTop: 12 }}>
            {!photoAttached ? (
              <button
                type="button"
                onClick={() => setPhotoAttached(true)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--hof-bg)',
                  border: '1px dashed var(--hof-border)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text-sec)',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect
                    stroke="currentColor"
                    strokeWidth="1.5"
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                  />
                  <circle stroke="currentColor" strokeWidth="1.5" cx="9" cy="10" r="1.5" />
                  <path stroke="currentColor" strokeWidth="1.5" d="M3 17 L9 12 L15 17 L21 13" />
                </svg>
                Attach photo or recap collage
              </button>
            ) : (
              <div
                style={{
                  position: 'relative',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--hof-elevated)',
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  Photo attached
                </span>
                <button
                  type="button"
                  onClick={() => setPhotoAttached(false)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: 'rgba(10,10,8,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--hof-border)',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      stroke="var(--hof-text)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      d="M6 6 L18 18 M18 6 L6 18"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Channel toggles */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ChannelToggle
              on={postTo.feed}
              onChange={(v) => setPostTo((p) => ({ ...p, feed: v }))}
              title="Post to home feed"
              sub="Visible to all members on the app home screen."
              recommended
            />
            <ChannelToggle
              on={postTo.email}
              onChange={(v) => setPostTo((p) => ({ ...p, email: v }))}
              title="Email subscribers"
              sub="1,247 people on The Smoke Signal."
            />
            <ChannelToggle
              on={postTo.sms}
              onChange={(v) => setPostTo((p) => ({ ...p, sms: v }))}
              title="SMS attendees"
              sub="Only people holding a ticket to Edition 24."
            />
          </div>

          {/* Submit row */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid var(--hof-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)' }}
            >
              {status === 'success' && <span style={{ color: '#4ade80' }}>{statusMsg}</span>}
              {status === 'error' && <span style={{ color: '#f87171' }}>{statusMsg}</span>}
              {status === 'idle' && (
                <span>
                  Posting to{' '}
                  <span style={{ color: 'var(--hof-text)', fontWeight: 500 }}>Home Feed</span>
                </span>
              )}
              {status === 'sending' && <span>Publishing…</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid var(--hof-border)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--hof-text)',
                  cursor: 'pointer',
                }}
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={!canPublish}
                onClick={() => {
                  void handlePublish();
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: canPublish ? 'var(--hof-amber)' : 'var(--hof-elevated)',
                  border: 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  fontWeight: 600,
                  color: canPublish ? 'var(--hof-bg)' : 'var(--hof-text-dis)',
                  cursor: canPublish ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 8 A6 6 0 1 0 6 8 c0 7-3 9-3 9 h18 s-3-2-3-9 M13.73 21 a2 2 0 0 1-3.46 0"
                  />
                </svg>
                {status === 'sending' ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* History panel */}
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            padding: 18,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Recent posts
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HISTORY.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  background: 'var(--hof-bg)',
                  border: '1px solid var(--hof-border)',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Pill tone={item.tone} size="sm">
                    {item.kind}
                  </Pill>
                  <span
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      color: 'var(--hof-text-sec)',
                    }}
                  >
                    {item.meta}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'Clash Display, system-ui',
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--hof-text)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-text-sec)',
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {item.body}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    color: 'var(--hof-text-sec)',
                    marginTop: 8,
                    letterSpacing: '0.06em',
                  }}
                >
                  {item.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
