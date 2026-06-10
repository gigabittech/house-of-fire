'use client';

import { PUSH_SEGMENTS, type PushSegment } from '@hof/push';
import { type CSSProperties, useCallback, useEffect, useState } from 'react';
import { Pill } from '@/components/Pill';

type CampaignRow = {
  id: string;
  title: string;
  body: string;
  segment: PushSegment;
  status: string;
  target_count: number;
  sent_count: number;
  failed_count: number;
  expired_count: number;
  created_at: string;
  event_id: string | null;
};

type EventOption = { id: string; label: string };

function segmentLabel(segment: PushSegment): string {
  return PUSH_SEGMENTS.find((s) => s.value === segment)?.label ?? segment;
}

function statusTone(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'partial' || status === 'sending') return 'warning';
  return 'neutral';
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0 14px',
  height: 44,
  background: 'var(--hof-bg)',
  border: '1px solid var(--hof-border)',
  borderRadius: 8,
  fontFamily: 'Inter, system-ui',
  fontSize: 14,
  color: 'var(--hof-text)',
  outline: 'none',
};

export default function PushPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [segment, setSegment] = useState<PushSegment>('all_members');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<EventOption[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const needsEvent = segment === 'event_attendees';

  const loadCampaigns = useCallback(async () => {
    const res = await fetch('/api/admin/push/campaigns?pageSize=20');
    if (!res.ok) return;
    const data = (await res.json()) as { campaigns?: CampaignRow[] };
    setCampaigns(data.campaigns ?? []);
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await fetch('/api/admin/events');
    if (!res.ok) return;
    const data = (await res.json()) as {
      events?: Array<{ id: string; edition_number: number; name: string }>;
    };
    setEvents(
      (data.events ?? []).map((e) => ({
        id: e.id,
        label: `Ed. ${e.edition_number} · ${e.name}`,
      })),
    );
  }, []);

  useEffect(() => {
    void loadCampaigns();
    void loadEvents();
  }, [loadCampaigns, loadEvents]);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    const params = new URLSearchParams({ segment });
    if (eventId) params.set('eventId', eventId);
    fetch(`/api/admin/push/preview?${params}`)
      .then((r) => r.json())
      .then((d: { recipientCount?: number }) => {
        if (!cancelled) setRecipientCount(d.recipientCount ?? 0);
      })
      .catch(() => {
        if (!cancelled) setRecipientCount(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [segment, eventId]);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    if (needsEvent && !eventId) {
      setError('Select an event for attendee targeting.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/push/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
          segment,
          eventId: eventId || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        campaign?: CampaignRow;
        delivery?: { sent: number; failed: number; expired: number };
      };

      if (!res.ok) {
        setError(data.error ?? 'Send failed');
        return;
      }

      const sent = data.delivery?.sent ?? data.campaign?.sent_count ?? 0;
      const failed = data.delivery?.failed ?? data.campaign?.failed_count ?? 0;
      setSuccess(`Push sent to ${sent} device${sent === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}.`);
      setTitle('');
      setBody('');
      await loadCampaigns();
    } catch {
      setError('Network error — try again.');
    } finally {
      setSending(false);
    }
  }

  async function retryCampaign(id: string) {
    setRetryingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/push/campaigns/${id}/retry`, { method: 'POST' });
      const data = (await res.json()) as { error?: string; delivery?: { sent: number; failed: number } };
      if (!res.ok) {
        setError(data.error ?? 'Retry failed');
        return;
      }
      setSuccess(`Retried ${data.delivery?.sent ?? 0} delivery(s).`);
      await loadCampaigns();
    } catch {
      setError('Network error during retry.');
    } finally {
      setRetryingId(null);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <>
      <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid var(--hof-border)' }}>
        <div
          style={{
            fontFamily: 'Inter, system-ui',
            fontSize: 10,
            color: 'var(--hof-text-sec)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          Push
        </div>
        <div
          style={{
            fontFamily: 'Clash Display, system-ui',
            fontWeight: 600,
            fontSize: 26,
            color: 'var(--hof-text)',
            marginTop: 4,
          }}
        >
          Web push
        </div>
        <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)', marginTop: 4 }}>
          Lock-screen alerts for members who opted in on the app.
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
            Compose
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            style={{ ...inputStyle, fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 17 }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Short message — what members need to know right now."
            rows={4}
            style={{
              ...inputStyle,
              height: 'auto',
              marginTop: 10,
              padding: 14,
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />

          <div style={{ marginTop: 10 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, system-ui',
                fontSize: 11,
                color: 'var(--hof-text-sec)',
                marginBottom: 6,
              }}
            >
              Tap opens
            </label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/event" style={inputStyle} />
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 11,
                  color: 'var(--hof-text-sec)',
                  marginBottom: 6,
                }}
              >
                Audience
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as PushSegment)}
                style={inputStyle}
              >
                {PUSH_SEGMENTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 11,
                  color: 'var(--hof-text-sec)',
                  marginBottom: 6,
                }}
              >
                Event {needsEvent ? '(required)' : '(optional for VIP)'}
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                style={inputStyle}
                disabled={!needsEvent && segment !== 'vip_members'}
              >
                <option value="">{segment === 'vip_members' ? 'All VIP members' : 'Select event'}</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--hof-bg)',
              border: '1px solid var(--hof-border)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'var(--hof-text-sec)',
            }}
          >
            {previewLoading
              ? 'Counting recipients…'
              : `Estimated reach: ${recipientCount ?? '—'} subscribed device${recipientCount === 1 ? '' : 's'}`}
          </div>

          {error ? (
            <div style={{ marginTop: 12, fontFamily: 'Inter, system-ui', fontSize: 12, color: '#f87171' }}>{error}</div>
          ) : null}
          {success ? (
            <div style={{ marginTop: 12, fontFamily: 'Inter, system-ui', fontSize: 12, color: '#4ade80' }}>
              {success}
            </div>
          ) : null}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => {
                void handleSend();
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: canSend ? 'var(--hof-amber)' : 'var(--hof-elevated)',
                color: canSend ? 'var(--hof-bg)' : 'var(--hof-text-dis)',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 600,
                cursor: canSend ? 'pointer' : 'not-allowed',
              }}
            >
              {sending ? 'Sending…' : 'Send push'}
            </button>
          </div>
        </div>

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
            Campaign analytics
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.length === 0 ? (
              <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)' }}>
                No campaigns yet.
              </div>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 14,
                    background: 'var(--hof-bg)',
                    border: '1px solid var(--hof-border)',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <Pill tone={statusTone(c.status)} size="sm">
                          {c.status}
                        </Pill>
                        <Pill tone="neutral" size="sm">
                          {segmentLabel(c.segment)}
                        </Pill>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Clash Display, system-ui',
                          fontWeight: 600,
                          fontSize: 15,
                          color: 'var(--hof-text)',
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter, system-ui',
                          fontSize: 12,
                          color: 'var(--hof-text-sec)',
                          marginTop: 4,
                        }}
                      >
                        {c.body}
                      </div>
                    </div>
                    {(c.failed_count > 0 || c.status === 'partial') && (
                      <button
                        type="button"
                        disabled={retryingId === c.id}
                        onClick={() => {
                          void retryCampaign(c.id);
                        }}
                        style={{
                          flexShrink: 0,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--hof-border)',
                          background: 'var(--hof-elevated)',
                          fontFamily: 'Inter, system-ui',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {retryingId === c.id ? 'Retrying…' : 'Retry failed'}
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      color: 'var(--hof-text-sec)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {formatWhen(c.created_at)} · target {c.target_count} · sent {c.sent_count} · failed{' '}
                    {c.failed_count} · expired {c.expired_count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
