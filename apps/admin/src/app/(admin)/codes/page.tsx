'use client';

import { useEffect, useState } from 'react';
import { PaneHeader } from '@/components/PaneHeader';
import { Pill } from '@/components/Pill';

type CodeRow = {
  id: string;
  code: string;
  kind: string;
  value: number;
  max_uses: number | null;
  uses: number;
  active: boolean;
  note: string | null;
  expires_at: string | null;
  created_at: string;
};

const POOL_LABELS: Record<string, [string, string]> = {
  crew: ['Crew', 'Photographers, helpers'],
  press: ['Press', 'Reviewers, podcasts'],
  goodwill: ['Goodwill', "On-the-spot, Jordan's call"],
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 40,
  padding: '0 12px',
  background: 'var(--hof-elevated)',
  border: '1px solid var(--hof-border)',
  borderRadius: 8,
  fontFamily: 'Inter, system-ui',
  fontSize: 14,
  color: 'var(--hof-text)',
  outline: 'none',
};

export default function CodesPage() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [compPools, setCompPools] = useState<Array<[string, string, string]>>([]);
  const [loading, setLoading] = useState(true);

  // New code form state
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newKind, setNewKind] = useState<'percent' | 'flat_cents'>('percent');
  const [newValue, setNewValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/codes')
      .then((r) => r.json())
      .then(
        (d: {
          codes?: CodeRow[];
          poolStats?: Array<{ pool: string; used: number; cap: number }>;
        }) => {
          setCodes(d.codes ?? []);
          const pools = (d.poolStats ?? []).map((p) => {
            const meta = POOL_LABELS[p.pool] ?? [p.pool, ''];
            const cap = p.cap > 0 ? p.cap : p.used || 1;
            return [meta[0], `${p.used} / ${cap}`, meta[1]] as [string, string, string];
          });
          setCompPools(
            pools.length > 0
              ? pools
              : [
                  ['Crew', '0 / 0', POOL_LABELS.crew?.[1] ?? ''],
                  ['Press', '0 / 0', POOL_LABELS.press?.[1] ?? ''],
                  ['Goodwill', '0 / 0', POOL_LABELS.goodwill?.[1] ?? ''],
                ],
          );
          setLoading(false);
        },
      )
      .catch(() => setLoading(false));
  }, []);

  async function createCode() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          kind: newKind,
          value: parseFloat(newValue),
          max_uses: newMaxUses ? parseInt(newMaxUses, 10) : null,
          note: newNote || null,
        }),
      });
      if (res.ok) {
        const d = (await res.json()) as { code?: CodeRow };
        if (d.code) {
          setCodes((prev) => [d.code as CodeRow, ...prev]);
        }
        setShowForm(false);
        setNewCode('');
        setNewKind('percent');
        setNewValue('');
        setNewMaxUses('');
        setNewNote('');
      }
    } finally {
      setSaving(false);
    }
  }

  async function deactivateCode(id: string) {
    if (!confirm('Deactivate this code?')) return;
    const res = await fetch(`/api/admin/codes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function formatValue(c: CodeRow): string {
    if (c.kind === 'percent') return `${c.value}%`;
    return `$${(c.value / 100).toFixed(2)}`;
  }

  function formatUses(c: CodeRow): string {
    return `${c.uses}${c.max_uses !== null ? ' / ' + c.max_uses : ' / ∞'}`;
  }

  return (
    <>
      <PaneHeader
        eyebrow="Admin"
        title="Codes & comps"
        sub="Discount codes, comp tickets, press passes — keep the door honest."
        cta={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: showForm ? 'var(--hof-elevated)' : 'var(--hof-amber)',
              border: showForm ? '1px solid var(--hof-border)' : 'none',
              fontFamily: 'Inter, system-ui',
              fontSize: 13,
              fontWeight: 600,
              color: showForm ? 'var(--hof-text)' : 'var(--hof-bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {showForm ? (
              '✕ Cancel'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M12 5 L12 19 M5 12 L19 12"
                  />
                </svg>
                New code
              </>
            )}
          </button>
        }
      />

      <div style={{ padding: '20px 28px 28px' }}>
        {/* New code form */}
        {showForm && (
          <div
            style={{
              marginBottom: 20,
              background: 'var(--hof-surface)',
              border: '1px solid var(--hof-border)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: 'Inter, system-ui',
                fontSize: 10,
                color: 'var(--hof-amber)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              New promo code
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}
            >
              {/* Code */}
              <div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Code
                </div>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="FIREFAMILY"
                  style={{
                    ...inputStyle,
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.04em',
                  }}
                />
              </div>

              {/* Type toggle */}
              <div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Type
                </div>
                <div style={{ display: 'flex', gap: 8, height: 40 }}>
                  <button
                    type="button"
                    onClick={() => setNewKind('percent')}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      fontFamily: 'Inter, system-ui',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      background:
                        newKind === 'percent' ? 'var(--hof-amber)' : 'var(--hof-elevated)',
                      border:
                        newKind === 'percent'
                          ? '1px solid var(--hof-amber)'
                          : '1px solid var(--hof-border)',
                      color: newKind === 'percent' ? 'var(--hof-bg)' : 'var(--hof-text)',
                    }}
                  >
                    Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewKind('flat_cents')}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      fontFamily: 'Inter, system-ui',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      background:
                        newKind === 'flat_cents' ? 'var(--hof-amber)' : 'var(--hof-elevated)',
                      border:
                        newKind === 'flat_cents'
                          ? '1px solid var(--hof-amber)'
                          : '1px solid var(--hof-border)',
                      color: newKind === 'flat_cents' ? 'var(--hof-bg)' : 'var(--hof-text)',
                    }}
                  >
                    Flat ($)
                  </button>
                </div>
              </div>

              {/* Value */}
              <div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Value {newKind === 'percent' ? '(% off)' : '(cents, e.g. 1000 = $10)'}
                </div>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newKind === 'percent' ? '15' : '1000'}
                  min="0"
                  style={inputStyle}
                />
              </div>

              {/* Max uses */}
              <div>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 11,
                    color: 'var(--hof-text-sec)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Max uses (blank = unlimited)
                </div>
                <input
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  placeholder="100"
                  min="1"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 11,
                  color: 'var(--hof-text-sec)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Note
              </div>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Friends & family 15% off"
                style={inputStyle}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: 'var(--hof-elevated)',
                  border: '1px solid var(--hof-border)',
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
                onClick={() => {
                  void createCode();
                }}
                disabled={saving || !newCode.trim() || !newValue}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  cursor: saving || !newCode.trim() || !newValue ? 'not-allowed' : 'pointer',
                  background:
                    saving || !newCode.trim() || !newValue
                      ? 'var(--hof-elevated)'
                      : 'var(--hof-amber)',
                  border:
                    saving || !newCode.trim() || !newValue ? '1px solid var(--hof-border)' : 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    saving || !newCode.trim() || !newValue
                      ? 'var(--hof-text-dis)'
                      : 'var(--hof-bg)',
                  opacity: saving || !newCode.trim() || !newValue ? 0.6 : 1,
                }}
              >
                {saving ? 'Creating…' : 'Create Code'}
              </button>
            </div>
          </div>
        )}

        {/* Codes table */}
        <div
          style={{
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1fr 2fr 100px',
              padding: '12px 18px',
              borderBottom: '1px solid var(--hof-border)',
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            <div>Code</div>
            <div>Kind</div>
            <div>Value</div>
            <div>Uses</div>
            <div>Notes</div>
            <div />
          </div>

          {loading && (
            <div
              style={{
                padding: '24px 18px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
                textAlign: 'center',
              }}
            >
              Loading…
            </div>
          )}

          {!loading && codes.length === 0 && (
            <div
              style={{
                padding: '24px 18px',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text-sec)',
                textAlign: 'center',
              }}
            >
              No codes yet. Create your first code above.
            </div>
          )}

          {codes.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr 1fr 2fr 100px',
                padding: '14px 18px',
                alignItems: 'center',
                borderBottom: i < codes.length - 1 ? '1px solid var(--hof-border)' : 'none',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
                color: 'var(--hof-text)',
                opacity: c.active ? 1 : 0.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  color: 'var(--hof-text)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {c.code}
              </div>
              <div>
                <Pill tone={c.kind === 'percent' ? 'amber' : 'gold'} size="sm">
                  {c.kind === 'percent' ? 'Discount' : 'Flat'}
                </Pill>
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatValue(c)}
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: 'var(--hof-text-sec)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatUses(c)}
              </div>
              <div style={{ color: 'var(--hof-text-sec)', fontSize: 12 }}>{c.note ?? '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {c.active && (
                  <button
                    type="button"
                    onClick={() => {
                      void deactivateCode(c.id);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: 'var(--hof-elevated)',
                      border: '1px solid var(--hof-border)',
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--hof-text-sec)',
                    }}
                  >
                    Deactivate
                  </button>
                )}
                {!c.active && (
                  <span
                    style={{
                      fontFamily: 'Inter, system-ui',
                      fontSize: 11,
                      color: 'var(--hof-text-dis)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    INACTIVE
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comp-ticket pool */}
        <div
          style={{
            marginTop: 24,
            padding: '16px 18px',
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-amber)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Comp-ticket pool
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {compPools.map(([label, value, sub]) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: 'Inter, system-ui',
                    fontSize: 10,
                    color: 'var(--hof-text-sec)',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: 'Clash Display, system-ui',
                    fontWeight: 600,
                    fontSize: 24,
                    color: 'var(--hof-text)',
                    marginTop: 4,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {value}
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
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
