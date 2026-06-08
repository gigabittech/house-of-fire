'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';

interface Report {
  id: string;
  postId?: string;
  kind: string;
  post: string;
  reporter: string;
  author: string;
  age: string;
  severity: 'high' | 'low';
}

interface QueueItem {
  id: string;
  title: string;
  body: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string | null;
  isAnonymous: boolean;
  channel: string;
  age: string;
  imageUrls: string[];
}

interface PostApiRow {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  is_anonymous: boolean;
  media_urls: unknown;
  created_at: string;
  profiles: { handle: string; display_name: string; avatar_url: string | null } | null;
}

interface ModLogEntry {
  id: string;
  action: string;
  reason: string | null;
  created_at: string;
  post: { id: string; title: string; channel: string } | null;
  moderator: { handle: string; display_name: string } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function parseMediaUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
}

interface PinnedItem {
  id: string;
  title: string;
  channel: string;
  author: string;
  age: string;
}

function ImageThumb({ url, onClick }: { url: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 0,
        border: '1px solid var(--hof-border)',
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'zoom-in',
        background: 'var(--hof-elevated)',
        width: 72,
        height: 72,
        flexShrink: 0,
      }}
    >
      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </button>
  );
}

function ReportCard({
  r,
  onDismiss,
  onHide,
}: {
  r: Report;
  onDismiss: (id: string) => void;
  onHide: (id: string, postId?: string) => void;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: 'var(--hof-bg)',
        border: '1px solid var(--hof-border)',
        borderRadius: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Pill tone={r.severity === 'high' ? 'danger' : 'warning'} size="sm">
          {r.kind}
        </Pill>
        <span style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)' }}>
          Reported by @{r.reporter} · {r.age} ago
        </span>
      </div>
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--hof-elevated)',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui',
          fontSize: 13,
          color: 'var(--hof-text)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        "{r.post}"
      </div>
      <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)', marginTop: 8 }}>
        Author: <span style={{ color: 'var(--hof-text)', fontWeight: 500 }}>@{r.author}</span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--hof-border)',
        }}
      >
        <button type="button" onClick={() => onDismiss(r.id)} style={ghostBtn}>
          Dismiss
        </button>
        <button type="button" onClick={() => onHide(r.id, r.postId)} style={ghostBtn}>
          Hide post
        </button>
      </div>
    </div>
  );
}

const ghostBtn: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  background: 'transparent',
  border: '1px solid var(--hof-border)',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  color: 'var(--hof-text-sec)',
};

function QueueCard({
  q,
  busy,
  onReject,
  onApprove,
  onDelete,
}: {
  q: QueueItem;
  busy: boolean;
  onReject: (id: string) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div
        style={{
          padding: 14,
          background: 'var(--hof-bg)',
          border: '1px solid var(--hof-border)',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <Avatar
            initials={(q.authorName || q.authorHandle).slice(0, 2).toUpperCase()}
            src={q.authorAvatar ?? undefined}
            size={36}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Inter, system-ui', fontWeight: 600, fontSize: 13, color: 'var(--hof-text)' }}>
                @{q.authorHandle}
              </span>
              {q.authorName !== q.authorHandle && (
                <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}>
                  {q.authorName}
                </span>
              )}
              {q.isAnonymous && (
                <Pill tone="warning" size="sm">
                  Posted anonymously
                </Pill>
              )}
            </div>
            <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)', marginTop: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--hof-amber)' }}>{q.channel}</span>
              {' · '}
              {q.age} ago
            </div>
          </div>
        </div>

        {q.title && (
          <div style={{ fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 15, color: 'var(--hof-text)', marginBottom: 6 }}>
            {q.title}
          </div>
        )}
        <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text)', lineHeight: 1.5 }}>
          {q.body}
        </div>

        {q.imageUrls.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {q.imageUrls.slice(0, 4).map((url) => (
              <ImageThumb key={url} url={url} onClick={() => setLightbox(url)} />
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--hof-border)',
            flexWrap: 'wrap',
          }}
        >
          <button type="button" disabled={busy} onClick={() => onApprove(q.id)} style={approveBtn}>
            Approve
          </button>
          <button type="button" disabled={busy} onClick={() => onReject(q.id)} style={ghostBtn}>
            Reject
          </button>
          <button type="button" disabled={busy} onClick={() => onDelete(q.id)} style={dangerBtn}>
            Delete
          </button>
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}
    </>
  );
}

const approveBtn: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  background: 'var(--hof-amber)',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--hof-bg)',
};

const dangerBtn: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  background: 'rgba(232,74,26,0.12)',
  border: '1px solid rgba(232,74,26,0.3)',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui',
  fontSize: 12,
  color: 'var(--hof-error)',
};

export default function ModPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pinned, setPinned] = useState<PinnedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<ModLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  async function loadQueue() {
    try {
      const res = await fetch('/api/admin/mod');
      const data = (await res.json()) as {
        posts?: PostApiRow[];
        reports?: Array<{
          id: string;
          reason: string;
          created_at: string;
          reporter: { handle: string } | null;
          post: {
            id: string;
            body: string | null;
            title: string;
            profiles: { handle: string } | null;
          } | null;
        }>;
        pinned?: PostApiRow[];
        error?: string;
      };
      if (data.error) {
        setError(data.error);
      } else {
        setQueue(
          (data.posts ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            body: p.body ?? p.title,
            authorHandle: p.profiles?.handle ?? 'unknown',
            authorName: p.profiles?.display_name ?? p.profiles?.handle ?? 'Member',
            authorAvatar: p.profiles?.avatar_url ?? null,
            isAnonymous: p.is_anonymous,
            channel: `#${p.channel}`,
            age: timeAgo(p.created_at),
            imageUrls: parseMediaUrls(p.media_urls),
          })),
        );
        setReports(
          (data.reports ?? []).map((r) => ({
            id: r.id,
            postId: r.post?.id,
            kind: r.reason,
            post: (r.post?.body ?? r.post?.title ?? '').slice(0, 80),
            reporter: r.reporter?.handle ?? 'member',
            author: r.post?.profiles?.handle ?? 'unknown',
            age: timeAgo(r.created_at),
            severity: /spam|harass/i.test(r.reason) ? 'high' : 'low',
          })),
        );
        setPinned(
          (data.pinned ?? []).map((p) => ({
            id: p.id,
            title: p.title,
            channel: `#${p.channel}`,
            author: p.profiles?.display_name ?? p.profiles?.handle ?? 'anon',
            age: timeAgo(p.created_at),
          })),
        );
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  async function patchPost(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      throw new Error(d.error ?? 'Action failed');
    }
  }

  async function runAction(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      setQueue((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(id: string) {
    await runAction(id, () => patchPost(id, { action: 'approved' }));
  }

  async function handleReject(id: string) {
    const reason = window.prompt('Optional reason for rejection (shown to member):') ?? '';
    await runAction(id, () => patchPost(id, { action: 'rejected', reason: reason || undefined }));
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Permanently delete this post? The author will be notified.')) return;
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/mod?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Delete failed');
      }
      setQueue((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnpin(id: string) {
    await patchPost(id, { is_pinned: false });
    setPinned((prev) => prev.filter((p) => p.id !== id));
  }

  async function dismissReport(id: string) {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  async function hideReport(id: string, postId?: string) {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved', hidePost: true }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (postId) setQueue((prev) => prev.filter((q) => q.id !== postId));
  }

  async function openLog() {
    setLogOpen(true);
    setLogLoading(true);
    try {
      const res = await fetch('/api/admin/mod/log');
      const data = (await res.json()) as { actions?: ModLogEntry[]; error?: string };
      if (data.error) throw new Error(data.error);
      setLogEntries(data.actions ?? []);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load mod log');
    } finally {
      setLogLoading(false);
    }
  }

  return (
    <>
      <div
        style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid var(--hof-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Moderation
          </div>
          <div style={{ fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 26, color: 'var(--hof-text)', letterSpacing: '-0.01em', marginTop: 4 }}>
            Keep the board honest
          </div>
          <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)', marginTop: 4 }}>
            {reports.length} reports awaiting review · {loading ? '…' : `${queue.length} posts awaiting approval`}
          </div>
        </div>
        <button type="button" onClick={() => void openLog()} style={ghostBtn}>
          Mod log
        </button>
      </div>

      {(error || actionError) && (
        <div
          style={{
            margin: '16px 28px 0',
            padding: '12px 16px',
            background: 'rgba(232,74,26,0.1)',
            border: '1px solid rgba(232,74,26,0.3)',
            borderRadius: 8,
            fontFamily: 'Inter, system-ui',
            fontSize: 13,
            color: 'var(--hof-error)',
          }}
        >
          {error ?? actionError}
        </div>
      )}

      <div
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Reported posts
            </div>
            <Pill tone="danger" size="sm">
              {reports.length} pending
            </Pill>
          </div>
          {reports.length === 0 ? (
            <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)', padding: '16px 0', textAlign: 'center' }}>
              No open reports
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map((r) => (
                <ReportCard key={r.id} r={r} onDismiss={(id) => void dismissReport(id)} onHide={(id, postId) => void hideReport(id, postId)} />
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Post queue
            </div>
            <Pill tone="amber" size="sm">
              {loading ? '…' : `${queue.length} waiting`}
            </Pill>
          </div>
          <div style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)', marginBottom: 12, lineHeight: 1.5 }}>
            Posts awaiting approval before they appear on the board.
          </div>
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)' }}>
              Loading…
            </div>
          ) : queue.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)' }}>
              Queue is empty — all caught up
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queue.map((q) => (
                <QueueCard
                  key={q.id}
                  q={q}
                  busy={busyId === q.id}
                  onApprove={(id) => void handleApprove(id)}
                  onReject={(id) => void handleReject(id)}
                  onDelete={(id) => void handleDelete(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ background: 'var(--hof-surface)', border: '1px solid var(--hof-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Inter, system-ui', fontSize: 10, color: 'var(--hof-text-sec)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Pinned posts
            </div>
            <span style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}>
              Max 3 pinned per channel
            </span>
          </div>
          {pinned.length === 0 ? (
            <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)', padding: '8px 0' }}>
              No pinned posts
            </div>
          ) : (
            pinned.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: i < pinned.length - 1 ? '1px solid var(--hof-border)' : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter, system-ui', fontWeight: 500, fontSize: 13, color: 'var(--hof-text)' }}>{p.title}</div>
                  <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)', marginTop: 2 }}>
                    {p.channel} · {p.author} · {p.age} ago
                  </div>
                </div>
                <button type="button" onClick={() => void handleUnpin(p.id)} style={ghostBtn}>
                  Unpin
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {logOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setLogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 420px)',
              height: '100%',
              background: 'var(--hof-surface)',
              borderLeft: '1px solid var(--hof-border)',
              overflowY: 'auto',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Clash Display, system-ui', fontWeight: 600, fontSize: 20, color: 'var(--hof-text)' }}>
                Mod log
              </div>
              <button type="button" onClick={() => setLogOpen(false)} style={ghostBtn}>
                Close
              </button>
            </div>
            {logLoading ? (
              <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)' }}>Loading…</div>
            ) : logEntries.length === 0 ? (
              <div style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)' }}>No moderation actions yet</div>
            ) : (
              logEntries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--hof-border)',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--hof-text)', textTransform: 'capitalize' }}>
                    {entry.action}
                  </div>
                  <div style={{ color: 'var(--hof-text-sec)', marginTop: 4 }}>
                    {entry.post?.title ?? 'Post'} · #{entry.post?.channel ?? '?'}
                  </div>
                  <div style={{ color: 'var(--hof-text-sec)', marginTop: 4 }}>
                    by @{entry.moderator?.handle ?? 'mod'} · {timeAgo(entry.created_at)} ago
                  </div>
                  {entry.reason && (
                    <div style={{ color: 'var(--hof-text-sec)', marginTop: 4, fontStyle: 'italic' }}>{entry.reason}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
