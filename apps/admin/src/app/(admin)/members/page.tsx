'use client';

import { useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Kpi } from '@/components/Kpi';
import { Pill } from '@/components/Pill';

interface MemberRow {
  name: string;
  email: string;
  tier: string;
  role: 'member' | 'crew';
  joined: string;
  editions: number;
  lastSeen: string;
  posts: number;
  flag: '' | 'new' | 'flagged' | 'photographer';
}

const MEMBERS: MemberRow[] = [
  {
    name: 'Sujan Bhuiyan',
    email: 'sujan@…',
    tier: 'VIP',
    role: 'member',
    joined: 'Apr 24',
    editions: 12,
    lastSeen: 'Ed 23',
    posts: 8,
    flag: '',
  },
  {
    name: 'Mia Castellanos',
    email: 'mia@…',
    tier: 'GA',
    role: 'member',
    joined: 'Jan 25',
    editions: 6,
    lastSeen: 'Ed 23',
    posts: 24,
    flag: '',
  },
  {
    name: 'Devon Park',
    email: 'devon@…',
    tier: 'GA',
    role: 'member',
    joined: 'Mar 25',
    editions: 4,
    lastSeen: 'Ed 23',
    posts: 41,
    flag: '',
  },
  {
    name: 'Tara Reyes',
    email: 'tara@…',
    tier: 'VIP',
    role: 'member',
    joined: 'Jun 24',
    editions: 11,
    lastSeen: 'Ed 22',
    posts: 5,
    flag: '',
  },
  {
    name: 'iris.w',
    email: 'iris@…',
    tier: 'GA',
    role: 'member',
    joined: 'Sep 25',
    editions: 2,
    lastSeen: 'Ed 23',
    posts: 17,
    flag: 'new',
  },
  {
    name: 'Jordan Groth',
    email: 'j@…',
    tier: 'Owner',
    role: 'crew',
    joined: 'Jan 24',
    editions: 24,
    lastSeen: 'Ed 23',
    posts: 86,
    flag: '',
  },
  {
    name: 'Mauro K.',
    email: 'mauro@…',
    tier: 'GA',
    role: 'crew',
    joined: 'Jan 24',
    editions: 22,
    lastSeen: 'Ed 23',
    posts: 14,
    flag: 'photographer',
  },
  {
    name: 'newbie_42',
    email: 'spam@…',
    tier: 'GA',
    role: 'member',
    joined: '6 days',
    editions: 0,
    lastSeen: '—',
    posts: 1,
    flag: 'flagged',
  },
];

export default function MembersPage() {
  const [search, setSearch] = useState('');

  const filtered = MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

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
            Members
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
            1,247 members
          </div>
          <div
            style={{
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text-sec)',
              marginTop: 4,
            }}
          >
            +34 this month · 62% return rate · 4 Crew · 2 Photographers
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: 'var(--hof-surface)',
            border: '1px solid var(--hof-border)',
            borderRadius: 8,
            width: 260,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle stroke="var(--hof-text-sec)" strokeWidth="1.5" cx="11" cy="11" r="7" />
            <path
              stroke="var(--hof-text-sec)"
              strokeWidth="1.5"
              strokeLinecap="round"
              d="M20 20 L16 16"
            />
          </svg>
          <input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 0,
              background: 'transparent',
              outline: 'none',
              fontFamily: 'Inter, system-ui',
              fontSize: 12,
              color: 'var(--hof-text)',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* KPI strip */}
      <div
        style={{
          padding: '20px 28px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        <Kpi label="Total members" value="1,247" delta="+34 this month" tone="amber" />
        <Kpi label="Active (90 day)" value="824" delta="66% of total" tone="neutral" />
        <Kpi label="Return rate" value="62%" delta="+4% YoY" tone="amber" />
        <Kpi label="Crew & comp" value="6" delta="4 Crew · 2 Photographers" tone="muted" />
      </div>

      <div style={{ padding: '20px 28px 28px' }}>
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
              gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.8fr 1fr 80px',
              padding: '12px 18px',
              borderBottom: '1px solid var(--hof-border)',
              fontFamily: 'Inter, system-ui',
              fontSize: 10,
              color: 'var(--hof-text-sec)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            <div>Member</div>
            <div>Email</div>
            <div>Tier</div>
            <div>Editions</div>
            <div>Last seen</div>
            <div>Posts</div>
            <div />
          </div>
          {filtered.map((m, i) => {
            const initials = m.name
              .split(' ')
              .map((s) => s[0] ?? '')
              .join('')
              .slice(0, 2);
            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 0.8fr 0.7fr 0.8fr 1fr 80px',
                  padding: '12px 18px',
                  alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--hof-border)' : 'none',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  color: 'var(--hof-text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar initials={initials} size={28} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      {m.role === 'crew' && (
                        <Pill tone="crew" size="sm">
                          Crew
                        </Pill>
                      )}
                      {m.flag === 'flagged' && (
                        <Pill tone="danger" size="sm">
                          Flagged
                        </Pill>
                      )}
                      {m.flag === 'new' && (
                        <Pill tone="amber" size="sm">
                          New
                        </Pill>
                      )}
                      {m.flag === 'photographer' && (
                        <Pill tone="gold" size="sm">
                          Photo
                        </Pill>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        color: 'var(--hof-text-dis)',
                      }}
                    >
                      Joined {m.joined}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    color: 'var(--hof-text-sec)',
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.email}
                </div>
                <div>
                  <Pill
                    tone={m.tier === 'VIP' || m.tier === 'Owner' ? 'gold' : 'neutral'}
                    size="sm"
                  >
                    {m.tier}
                  </Pill>
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.editions}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: 'var(--hof-text-sec)',
                  }}
                >
                  {m.lastSeen}
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.posts}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      stroke="var(--hof-text-sec)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 6 L15 12 L9 18"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
