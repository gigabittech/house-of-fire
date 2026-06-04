'use client';

import { useCallback, useEffect, useState } from 'react';
import { DoorLiveGuests } from '@/components/DoorLiveGuests';
import {
  DoorQueueBanner,
  SellAtDoorModal,
  type DoorTierOption,
} from '@/components/SellAtDoorModal';
import { drainDoorSaleQueue } from '@/lib/doorSaleQueue';
import { formatDoorsTime } from '@/lib/formatters';

const EVENT_STORAGE_KEY = 'hof-door-event-id';

function DoorStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'amber';
}) {
  const c = tone === 'amber' ? 'var(--hof-amber)' : 'var(--hof-text)';
  return (
    <div
      style={{
        background: 'var(--hof-surface)',
        border: '1px solid var(--hof-border)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
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
          fontSize: 22,
          color: c,
          marginTop: 4,
          letterSpacing: '-0.01em',
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
  );
}

type DoorEventOption = {
  id: string;
  name: string;
  edition_number: number;
  status: string;
};

export default function DoorPage() {
  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [guestsRefreshKey, setGuestsRefreshKey] = useState(0);
  const [tiers, setTiers] = useState<DoorTierOption[]>([]);
  const [eventOptions, setEventOptions] = useState<DoorEventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [headerEdition, setHeaderEdition] = useState('Loading…');
  const [headerSub, setHeaderSub] = useState('');
  const [statSold, setStatSold] = useState('—');
  const [statScanned, setStatScanned] = useState('—');
  const [statScannedSub, setStatScannedSub] = useState('');
  const [statWalkupCount, setStatWalkupCount] = useState('—');
  const [statWalkupSub, setStatWalkupSub] = useState('');
  const [statRemaining, setStatRemaining] = useState('—');
  const [eventContext, setEventContext] = useState<{
    edition_number: number;
    name: string;
    date: string;
    venue_name: string;
    doors_open: string;
    doors_close: string;
  } | null>(null);

  function bumpGuests() {
    setGuestsRefreshKey((k) => k + 1);
  }

  const loadStats = useCallback(async () => {
    try {
      const q = selectedEventId ? `?eventId=${selectedEventId}` : '';
      const res = await fetch(`/api/admin/door/stats${q}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        event: {
          id: string;
          name: string;
          edition_number: number;
          venue_name: string;
          doors_open: string;
          doors_close: string;
          date: string;
        };
        stats: {
          sold: number;
          scanned: number;
          walkupCount: number;
          walkupGrossCents: number;
          remaining: number;
          capacity: number;
        };
        tiers: DoorTierOption[];
      };
      setTiers(data.tiers ?? []);
      if (!selectedEventId) {
        setSelectedEventId(data.event.id);
        sessionStorage.setItem(EVENT_STORAGE_KEY, data.event.id);
      }
      setHeaderEdition(`${data.event.name} · Edition ${data.event.edition_number}`);
      setHeaderSub(`Doors open ${formatDoorsTime(data.event.doors_open)} · ${data.event.venue_name}`);
      const pct =
        data.stats.sold > 0 ? Math.round((data.stats.scanned / data.stats.sold) * 100) : 0;
      setStatSold(String(data.stats.sold));
      setStatScanned(String(data.stats.scanned));
      setStatScannedSub(data.stats.sold > 0 ? `${pct}% in` : '');
      setStatWalkupCount(String(data.stats.walkupCount));
      setStatWalkupSub(
        data.stats.walkupCount > 0
          ? `$${(data.stats.walkupGrossCents / 100).toFixed(0)} gross`
          : 'none yet',
      );
      setStatRemaining(String(data.stats.remaining));
      setEventContext({
        edition_number: data.event.edition_number,
        name: data.event.name,
        date: data.event.date,
        venue_name: data.event.venue_name,
        doors_open: data.event.doors_open,
        doors_close: data.event.doors_close,
      });
    } catch {
      /* keep placeholders */
    }
  }, [selectedEventId]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/admin/events');
        if (!res.ok) return;
        const data = (await res.json()) as { events: DoorEventOption[] };
        const pickable = (data.events ?? []).filter((e) =>
          ['live', 'upcoming'].includes(e.status),
        );
        setEventOptions(pickable);
        const stored = sessionStorage.getItem(EVENT_STORAGE_KEY);
        const live = pickable.find((e) => e.status === 'live');
        const upcoming = pickable.find((e) => e.status === 'upcoming');
        const defaultId =
          (stored && pickable.some((e) => e.id === stored) ? stored : null) ??
          live?.id ??
          upcoming?.id ??
          null;
        if (defaultId) setSelectedEventId(defaultId);
      } catch {
        /* silent */
      }
    }
    void loadEvents();
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    const id = setInterval(() => void loadStats(), 15_000);
    return () => clearInterval(id);
  }, [loadStats]);

  useEffect(() => {
    void drainDoorSaleQueue().then(() => void loadStats());
  }, [loadStats]);

  function onEventChange(eventId: string) {
    setSelectedEventId(eventId);
    sessionStorage.setItem(EVENT_STORAGE_KEY, eventId);
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!scanCode.trim()) return;
    const code = scanCode.trim();
    try {
      const res = await fetch('/api/admin/door/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        await res.json();
        setScanResult({ ok: true, message: 'Checked in successfully.' });
        void loadStats();
        bumpGuests();
      } else {
        const data = (await res.json()) as { error?: string };
        setScanResult({ ok: false, message: data.error ?? 'Error checking in.' });
      }
    } catch {
      setScanResult({ ok: false, message: 'Network error.' });
    }
    setScanCode('');
  }

  return (
    <>
      {/* Header */}
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
            Door · Tonight
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
            {headerEdition}
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            {headerSub || '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {eventOptions.length > 0 && (
            <select
              value={selectedEventId ?? ''}
              onChange={(e) => onEventChange(e.target.value)}
              style={{
                height: 40,
                padding: '0 12px',
                borderRadius: 8,
                background: 'var(--hof-bg)',
                border: '1px solid var(--hof-border)',
                color: 'var(--hof-text)',
                fontFamily: 'Inter, system-ui',
                fontSize: 13,
              }}
            >
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} · Ed. {ev.edition_number}
                  {ev.status === 'live' ? ' (live)' : ''}
                </option>
              ))}
            </select>
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'rgba(76,175,110,0.10)',
              border: '1px solid rgba(76,175,110,0.3)',
              fontFamily: 'Inter, system-ui',
              fontSize: 11,
              color: 'var(--hof-success)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: 'var(--hof-success)',
                animation: 'hof-pulse 1.4s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            Scanner live
          </span>
        </div>
      </div>

      <DoorQueueBanner onSynced={() => void loadStats()} />

      <div style={{ padding: '20px 28px 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {/* Scanner side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Scanner input */}
            <div
              style={{
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
                  marginBottom: 12,
                }}
              >
                QR Scanner
              </div>
              <form
                onSubmit={(e) => {
                  void handleScan(e);
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="Scan or type ticket code (e.g. HOF-24-0001)"
                  autoFocus
                  style={{
                    flex: 1,
                    height: 44,
                    padding: '0 14px',
                    background: 'var(--hof-bg)',
                    border: '1px solid var(--hof-border)',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    color: 'var(--hof-text)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0 20px',
                    height: 44,
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
                  Check In
                </button>
              </form>
              {scanResult && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: scanResult.ok ? 'rgba(76,175,110,0.12)' : 'rgba(232,74,26,0.12)',
                    border: scanResult.ok
                      ? '1px solid rgba(76,175,110,0.3)'
                      : '1px solid rgba(232,74,26,0.3)',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 13,
                    color: scanResult.ok ? 'var(--hof-success)' : 'var(--hof-error)',
                  }}
                >
                  {scanResult.message}
                </div>
              )}
            </div>

            {/* Door stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <DoorStat label="Sold" value={statSold} sub="online" />
              <DoorStat
                label="Scanned"
                value={statScanned}
                sub={statScannedSub || 'checked in'}
                tone="amber"
              />
              <DoorStat
                label="Walk-ups"
                value={statWalkupCount}
                sub={statWalkupSub || 'walk-ups'}
              />
              <DoorStat label="Remaining" value={statRemaining} sub="capacity left" />
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sell at door card */}
            <div
              style={{
                padding: 20,
                background:
                  'linear-gradient(155deg, rgba(232,101,26,0.16) 0%, var(--hof-surface) 60%)',
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
                }}
              >
                Walk-up sales
              </div>
              <div
                style={{
                  fontFamily: 'Clash Display, system-ui',
                  fontWeight: 600,
                  fontSize: 24,
                  color: 'var(--hof-text)',
                  letterSpacing: '-0.01em',
                  marginTop: 6,
                  lineHeight: 1.2,
                }}
              >
                Friend showed up
                <br />
                without a ticket?
              </div>
              <div
                style={{
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text-sec)',
                  marginTop: 8,
                }}
              >
                Capture details, record payment, issue QR tickets — ready to scan at the door.
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 8,
                    background: 'var(--hof-amber)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--hof-bg)',
                  }}
                >
                  + Sell at the door
                </button>
              </div>
            </div>

            <DoorLiveGuests eventId={selectedEventId} refreshKey={guestsRefreshKey} />
          </div>
        </div>
      </div>

      <SellAtDoorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        tiers={tiers}
        eventContext={eventContext}
        onSold={() => bumpGuests()}
        onRefreshStats={() => void loadStats()}
      />
    </>
  );
}
