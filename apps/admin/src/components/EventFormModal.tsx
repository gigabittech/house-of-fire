'use client';

import { useEffect, useRef, useState } from 'react';
import type { EventFaq, EventFormPayload, EventStatus } from '@/lib/eventPayload';
import { DEFAULT_EVENT_FORM } from '@/lib/eventPayload';
import type { TierFormRow } from '@/lib/tierPayload';
import { uploadEventHero } from '@/lib/storageUpload';
import { TicketTiersEditor } from '@/components/TicketTiersEditor';

interface EventFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  eventId?: string;
  initial?: Partial<EventFormPayload>;
  initialTiers?: TierFormRow[];
  soldByTierId?: Record<string, number>;
  sold?: number;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

const STATUSES: Array<{ value: EventStatus; label: string }> = [
  { value: 'upcoming', label: 'Draft (upcoming)' },
  { value: 'live', label: 'Live' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

function parseFaqsFromJson(raw: unknown): EventFaq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is EventFaq =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as EventFaq).q === 'string' &&
        typeof (item as EventFaq).a === 'string',
    )
    .map((f) => ({ q: f.q, a: f.a }));
}

export function EventFormModal({
  open,
  mode,
  eventId,
  initial,
  initialTiers = [],
  soldByTierId = {},
  sold = 0,
  onClose,
  onSaved,
  onDeleted,
}: EventFormModalProps) {
  const [form, setForm] = useState<EventFormPayload>(DEFAULT_EVENT_FORM);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [removeHero, setRemoveHero] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [tiers, setTiers] = useState<TierFormRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setHeroFile(null);
    setRemoveHero(false);
    setHeroPreview(initial?.hero_image_url ?? null);
    setForm({
      ...DEFAULT_EVENT_FORM,
      ...initial,
      faqs: initial?.faqs ?? [],
      max_tickets_per_user: initial?.max_tickets_per_user ?? DEFAULT_EVENT_FORM.max_tickets_per_user,
    });
    setTiers(initialTiers.map((t) => ({ ...t })));
  }, [open, initial, initialTiers]);

  useEffect(() => {
    if (!heroFile) return;
    const url = URL.createObjectURL(heroFile);
    setHeroPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [heroFile]);

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: 42,
    padding: '0 12px',
    background: 'var(--hof-bg)',
    border: '1px solid var(--hof-border)',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui',
    fontSize: 14,
    color: 'var(--hof-text)',
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    minHeight: 72,
    padding: '10px 12px',
    resize: 'vertical',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui',
    fontSize: 10,
    color: 'var(--hof-text-sec)',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  };

  function setField<K extends keyof EventFormPayload>(key: K, value: EventFormPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setFaq(index: number, field: 'q' | 'a', value: string) {
    setForm((prev) => {
      const faqs = [...prev.faqs];
      const current = faqs[index] ?? { q: '', a: '' };
      faqs[index] = { ...current, [field]: value };
      return { ...prev, faqs };
    });
  }

  function addFaq() {
    setForm((prev) => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }));
  }

  function removeFaq(index: number) {
    setForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        tagline: form.tagline?.trim() || null,
        hero_image_url: removeHero ? null : form.hero_image_url,
        faqs: form.faqs.filter((f) => f.q.trim() || f.a.trim()),
      };

      const url =
        mode === 'edit' && eventId ? `/api/admin/events/${eventId}` : '/api/admin/events';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string; event?: { id: string } };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save event');
        return;
      }

      const savedId = mode === 'edit' ? eventId : data.event?.id;
      if (!savedId) {
        setError('Event saved but id missing');
        return;
      }

      if (heroFile) {
        const heroUrl = await uploadEventHero(savedId, heroFile);
        setForm((prev) => ({ ...prev, hero_image_url: heroUrl }));
      }

      const tierCapacity = tiers
        .filter((t) => t.status !== 'hidden')
        .reduce((sum, t) => sum + t.capacity, 0);

      const tiersRes = await fetch(`/api/admin/events/${savedId}/tiers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers }),
      });
      const tiersData = (await tiersRes.json()) as { error?: string };
      if (!tiersRes.ok) {
        setError(tiersData.error ?? 'Failed to save ticket tiers');
        return;
      }

      if (tierCapacity !== form.capacity) {
        await fetch(`/api/admin/events/${savedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capacity: tierCapacity }),
        });
      }

      onSaved();
      onClose();
    } catch {
      setError('Failed to save event');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!eventId || sold > 0) return;
    if (!window.confirm('Delete this edition permanently? This cannot be undone.')) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete event');
        return;
      }
      onDeleted?.();
      onClose();
    } catch {
      setError('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 14,
          color: 'var(--hof-text)',
          fontFamily: 'Inter, system-ui',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--hof-border)',
            display: 'flex',
            alignItems: 'baseline',
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
              {mode === 'create' ? 'New edition' : 'Edit edition'}
            </div>
            <div
              style={{
                fontFamily: 'Clash Display, system-ui',
                fontWeight: 600,
                fontSize: 22,
                color: 'var(--hof-text)',
                letterSpacing: '-0.01em',
                marginTop: 4,
              }}
            >
              {mode === 'create' ? 'Create event' : form.name || 'Event details'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: 'var(--hof-elevated)',
              border: '1px solid var(--hof-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                stroke="var(--hof-text-sec)"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M6 6 L18 18 M18 6 L6 18"
              />
            </svg>
          </button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Edition #</label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                value={form.edition_number}
                onChange={(e) => setField('edition_number', Number(e.target.value))}
              />
            </div>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tagline</label>
            <input
              style={inputStyle}
              value={form.tagline ?? ''}
              onChange={(e) => setField('tagline', e.target.value || null)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Doors open</label>
              <input
                type="time"
                style={inputStyle}
                value={form.doors_open}
                onChange={(e) => setField('doors_open', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Doors close</label>
              <input
                type="time"
                style={inputStyle}
                value={form.doors_close}
                onChange={(e) => setField('doors_close', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Venue</label>
              <input
                style={inputStyle}
                value={form.venue_name}
                onChange={(e) => setField('venue_name', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Max tickets per account</label>
              <input
                type="number"
                min={1}
                max={20}
                style={inputStyle}
                value={form.max_tickets_per_user}
                onChange={(e) =>
                  setField('max_tickets_per_user', Number(e.target.value) || 4)
                }
              />
            </div>
          </div>

          <TicketTiersEditor tiers={tiers} onChange={setTiers} soldByTierId={soldByTierId} />

          <div>
            <label style={labelStyle}>Address</label>
            <input
              style={inputStyle}
              value={form.venue_address}
              onChange={(e) => setField('venue_address', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Latitude</label>
              <input
                type="number"
                step="any"
                style={inputStyle}
                value={form.venue_lat ?? ''}
                onChange={(e) =>
                  setField('venue_lat', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input
                type="number"
                step="any"
                style={inputStyle}
                value={form.venue_lng ?? ''}
                onChange={(e) =>
                  setField('venue_lng', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setField('status', e.target.value as EventStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Hero image</label>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setHeroFile(f);
                    setRemoveHero(false);
                  }
                  if (heroInputRef.current) heroInputRef.current.value = '';
                }}
              />
              {heroPreview && !removeHero ? (
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <img
                    src={heroPreview}
                    alt="Hero preview"
                    style={{
                      width: '100%',
                      maxHeight: 160,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--hof-border)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setHeroFile(null);
                      setHeroPreview(null);
                      setRemoveHero(true);
                      setField('hero_image_url', null);
                    }}
                    style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--hof-border)',
                      background: 'var(--hof-bg)',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 12,
                      color: 'var(--hof-text-sec)',
                      cursor: 'pointer',
                    }}
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px dashed var(--hof-border)',
                  background: 'var(--hof-bg)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text-sec)',
                  cursor: 'pointer',
                }}
              >
                {heroPreview && !removeHero ? 'Replace image' : 'Upload hero image'}
              </button>
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={labelStyle}>FAQs</span>
              <button
                type="button"
                onClick={addFaq}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'var(--hof-elevated)',
                  border: '1px solid var(--hof-border)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 12,
                  color: 'var(--hof-text)',
                }}
              >
                + Add FAQ
              </button>
            </div>
            {form.faqs.length === 0 && (
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text-sec)',
                  padding: '8px 0',
                }}
              >
                No FAQs yet.
              </div>
            )}
            {form.faqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: 'var(--hof-bg)',
                  borderRadius: 8,
                  border: '1px solid var(--hof-border)',
                }}
              >
                <input
                  style={{ ...inputStyle, marginBottom: 8 }}
                  placeholder="Question"
                  value={faq.q}
                  onChange={(e) => setFaq(i, 'q', e.target.value)}
                />
                <textarea
                  style={textareaStyle}
                  placeholder="Answer"
                  value={faq.a}
                  onChange={(e) => setFaq(i, 'a', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  style={{
                    marginTop: 8,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'transparent',
                    border: '1px solid var(--hof-border)',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 12,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {sold > 0 && mode === 'edit' && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--hof-elevated)',
                border: '1px solid var(--hof-border)',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
              }}
            >
              {sold} ticket(s) sold — delete is disabled. Set status to Cancelled to retire this
              edition.
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.3)',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 22px 18px',
            borderTop: '1px solid var(--hof-border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div>
            {mode === 'edit' && sold === 0 && (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={deleting || saving}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(220,38,38,0.4)',
                  cursor: deleting || saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#f87171',
                  opacity: deleting || saving ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete edition'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              style={{
                padding: '10px 16px',
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
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || deleting || !form.name.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'var(--hof-amber)',
                border: 'none',
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--hof-bg)',
                opacity: saving || !form.name.trim() ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : mode === 'create' ? 'Create edition' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { parseFaqsFromJson };
