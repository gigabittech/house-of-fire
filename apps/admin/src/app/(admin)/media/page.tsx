'use client';

import { useEffect, useState } from 'react';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';

interface PhotoApiRow {
  id: string;
  event_id: string;
  public_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  events: { edition_number: number } | null;
  profiles: { handle: string; display_name: string; avatar_url: string | null } | null;
}

interface PhotoItem {
  id: string;
  author: string;
  edition: string;
  status: 'pending' | 'approved' | 'rejected';
  public_url: string | null;
}

export default function MediaPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPhotos() {
    try {
      const res = await fetch('/api/admin/media?status=pending');
      const data = (await res.json()) as { photos?: PhotoApiRow[]; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        const mapped: PhotoItem[] = (data.photos ?? []).map((p) => ({
          id: p.id,
          author: p.profiles?.handle ?? 'unknown',
          edition: p.events?.edition_number ? `Ed ${p.events.edition_number}` : 'Ed ?',
          status: p.status,
          public_url: p.public_url,
        }));
        setPhotos(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void loadPhotos();
  }, []);

  async function approve(id: string) {
    try {
      await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
    } catch {
      // silent
    }
  }

  async function reject(id: string) {
    try {
      await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)));
    } catch {
      // silent
    }
  }

  const pending = photos.filter((p) => p.status === 'pending');

  return (
    <>
      <PaneHeader
        eyebrow="Media"
        title="Photo review"
        sub={loading ? 'Loading…' : `${pending.length} pending`}
        cta={
          <Pill tone="warning" size="sm">
            {loading ? '…' : `${pending.length} pending`}
          </Pill>
        }
      />

      <div style={{ padding: '20px 28px 28px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(232,74,26,0.1)',
              border: '1px solid rgba(232,74,26,0.3)',
              borderRadius: 8,
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              color: 'var(--hof-error)',
              marginBottom: 16,
            }}
          >
            Error: {error}
          </div>
        )}
        {!loading && photos.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'Inter, system-ui',
              fontSize: 14,
              color: 'var(--hof-text-sec)',
            }}
          >
            No photos to review.
          </div>
        )}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  background: 'var(--hof-surface)',
                  border: '1px solid var(--hof-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{ width: '100%', aspectRatio: '4/3', background: 'var(--hof-elevated)' }}
                />
                <div style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 12,
                      color: 'var(--hof-text-sec)',
                    }}
                  >
                    Loading…
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  background: 'var(--hof-surface)',
                  border: '1px solid var(--hof-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {/* Photo */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    background: 'var(--hof-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {photo.public_url ? (
                    <img
                      src={photo.public_url}
                      alt={`Photo by @${photo.author}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect
                        stroke="var(--hof-border-hi)"
                        strokeWidth="1.5"
                        x="3"
                        y="4"
                        width="18"
                        height="16"
                        rx="2"
                      />
                      <circle
                        stroke="var(--hof-border-hi)"
                        strokeWidth="1.5"
                        cx="9"
                        cy="10"
                        r="1.5"
                      />
                      <path
                        stroke="var(--hof-border-hi)"
                        strokeWidth="1.5"
                        d="M3 17 L9 12 L15 17 L21 13"
                      />
                    </svg>
                  )}
                  {photo.status !== 'pending' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          photo.status === 'approved'
                            ? 'rgba(76,175,110,0.3)'
                            : 'rgba(232,74,26,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Pill tone={photo.status === 'approved' ? 'success' : 'danger'} size="md">
                        {photo.status}
                      </Pill>
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Inter, system-ui',
                        fontSize: 12,
                        color: 'var(--hof-text)',
                        fontWeight: 500,
                      }}
                    >
                      @{photo.author}
                    </div>
                    <Pill tone="neutral" size="sm">
                      {photo.edition}
                    </Pill>
                  </div>
                  {photo.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => void approve(photo.id)}
                        style={{
                          flex: 1,
                          height: 30,
                          background: 'var(--hof-success)',
                          border: 'none',
                          borderRadius: 6,
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
                        onClick={() => void reject(photo.id)}
                        style={{
                          flex: 1,
                          height: 30,
                          background: 'var(--hof-elevated)',
                          border: '1px solid var(--hof-border)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontFamily: 'Inter, system-ui',
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--hof-text-sec)',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
