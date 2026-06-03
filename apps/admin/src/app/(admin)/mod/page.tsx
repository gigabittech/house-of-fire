'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Pill } from '@/components/Pill';

interface Report {
  id: string;
  kind: string;
  post: string;
  reporter: string;
  author: string;
  age: string;
  severity: 'high' | 'low';
}

interface QueueItem {
  id: string;
  kind: string;
  body: string;
  author: string;
  channel: string;
  age: string;
}

interface PostApiRow {
  id: string;
  channel: string;
  title: string;
  body: string | null;
  created_at: string;
  profiles: { handle: string; display_name: string; avatar_url: string | null } | null;
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

const REPORTS: Report[] = [
  {
    id: 'r1',
    kind: 'spam',
    post: 'check out this site for cheap tix...',
    reporter: 'iris.w · member',
    author: 'newbie_42',
    age: '12m',
    severity: 'high',
  },
  {
    id: 'r2',
    kind: 'off-topic',
    post: 'Anyone selling extra GA?',
    reporter: '3 members',
    author: 'devon',
    age: '2h',
    severity: 'low',
  },
];

function ReportCard({ r }: { r: Report }) {
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
        <span
          style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)' }}
        >
          Reported by {r.reporter} · {r.age} ago
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
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 11,
          color: 'var(--hof-text-sec)',
          marginTop: 8,
        }}
      >
        by <span style={{ color: 'var(--hof-text)', fontWeight: 500 }}>{r.author}</span>
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
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'transparent',
            border: '1px solid var(--hof-border)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-text-sec)',
          }}
        >
          Dismiss
        </button>
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'transparent',
            border: '1px solid var(--hof-border)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-text)',
          }}
        >
          Hide post
        </button>
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'rgba(232,74,26,0.12)',
            border: '1px solid rgba(232,74,26,0.3)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-error)',
          }}
        >
          Ban author
        </button>
      </div>
    </div>
  );
}

function QueueCard({ q, onDelete }: { q: QueueItem; onDelete: (id: string) => void }) {
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
        <Pill tone="amber" size="sm">
          {q.kind}
        </Pill>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--hof-amber)',
            letterSpacing: '0.04em',
          }}
        >
          {q.channel}
        </span>
        <span
          style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)' }}
        >
          · {q.age} ago
        </span>
      </div>
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 13,
          color: 'var(--hof-text)',
          lineHeight: 1.5,
        }}
      >
        {q.body}
      </div>
      <div
        style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 11,
          color: 'var(--hof-text-sec)',
          marginTop: 8,
        }}
      >
        by <span style={{ color: 'var(--hof-text)', fontWeight: 500 }}>{q.author}</span>
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
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'var(--hof-amber)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--hof-bg)',
          }}
        >
          Approve
        </button>
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'transparent',
            border: '1px solid var(--hof-border)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-text)',
          }}
        >
          Edit & approve
        </button>
        <button
          onClick={() => onDelete(q.id)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'rgba(232,74,26,0.12)',
            border: '1px solid rgba(232,74,26,0.3)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui',
            fontSize: 12,
            color: 'var(--hof-error)',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ModPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/mod');
        const data = (await res.json()) as { posts?: PostApiRow[]; error?: string };
        if (data.error) {
          setError(data.error);
        } else {
          const mapped: QueueItem[] = (data.posts ?? []).map((p) => ({
            id: p.id,
            kind: 'post',
            body: p.body ?? p.title,
            author: p.profiles?.handle ?? 'anon',
            channel: '#' + p.channel,
            age: timeAgo(p.created_at),
          }));
          setQueue(mapped);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/admin/mod?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setQueue((prev) => prev.filter((q) => q.id !== id));
    } catch {
      // silent
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
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Moderation
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
            Keep the board honest
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {REPORTS.length} reports awaiting review · {loading ? '…' : queue.length} posts in queue
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--hof-border)',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--hof-text)',
            }}
          >
            Mod log
          </button>
          <button
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              background: 'var(--hof-amber)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--hof-bg)',
            }}
          >
            Promote to Crew
          </button>
        </div>
      </div>

      {error && (
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
          Error: {error}
        </div>
      )}

      <div
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {/* Reports queue */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
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
              Reported posts
            </div>
            <Pill tone="danger" size="sm">
              {REPORTS.length} pending
            </Pill>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REPORTS.map((r) => (
              <ReportCard key={r.id} r={r} />
            ))}
          </div>
        </div>

        {/* First-post queue */}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
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
              Post queue
            </div>
            <Pill tone="amber" size="sm">
              {loading ? '…' : `${queue.length} waiting`}
            </Pill>
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            30 most recent posts. Delete to remove from the board.
          </div>
          {loading && (
            <div
              style={{
                padding: '16px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
                textAlign: 'center',
              }}
            >
              Loading…
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!loading &&
              queue.map((q) => (
                <QueueCard key={q.id} q={q} onDelete={(id) => void handleDelete(id)} />
              ))}
          </div>
        </div>
      </div>

      {/* Pinned posts */}
      <div style={{ padding: '0 28px 28px' }}>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
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
              Pinned posts
            </div>
            <span
              style={{ fontFamily: 'Inter, system-ui', fontSize: 12, color: 'var(--hof-text-sec)' }}
            >
              Max 3 pinned per channel
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 0',
              borderBottom: '1px solid var(--hof-border)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                stroke="var(--hof-amber)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21 s-7 -7 -7 -12 a7 7 0 0 1 14 0 c0 5 -7 12 -7 12 Z"
              />
              <circle stroke="var(--hof-amber)" strokeWidth="1.5" cx="12" cy="9" r="2.5" />
            </svg>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontWeight: 500,
                  fontSize: 13,
                  color: 'var(--hof-text)',
                }}
              >
                Edition 24 lineup is final
              </div>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 11,
                  color: 'var(--hof-text-sec)',
                  marginTop: 2,
                }}
              >
                #general · Jordan Groth · 1 day ago
              </div>
            </div>
            <button
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'transparent',
                border: '1px solid var(--hof-border)',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui',
                fontSize: 12,
                color: 'var(--hof-text-sec)',
              }}
            >
              Unpin
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0 0' }}>
            <Avatar initials="JG" size={20} />
            <div
              style={{ fontFamily: 'Inter, system-ui', fontSize: 13, color: 'var(--hof-text-sec)' }}
            >
              Pinning a post from #general makes it the top item on every member's home feed.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
