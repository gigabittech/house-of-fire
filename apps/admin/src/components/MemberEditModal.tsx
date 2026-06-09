'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import type { MemberRecord, MemberRole, MemberUpdatePayload } from '@/lib/memberPayload';
import { formatJoined } from '@/lib/formatters';
import { removeMemberAvatar, uploadMemberAvatar } from '@/lib/storageUpload';

interface MemberEditModalProps {
  open: boolean;
  memberId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, system-ui',
  fontSize: 10,
  color: 'var(--hof-text-sec)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 6,
  display: 'block',
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

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        background: checked ? 'var(--hof-elevated)' : 'var(--hof-bg)',
        border: `1px solid ${checked ? 'var(--hof-amber)' : 'var(--hof-border)'}`,
        borderRadius: 10,
        cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      <div
        style={{
          width: 34,
          height: 20,
          borderRadius: 10,
          flexShrink: 0,
          background: checked ? 'var(--hof-amber)' : 'var(--hof-border)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 16 : 2,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: '#fff',
            transition: 'left 120ms ease-out',
          }}
        />
      </div>
      <div>
        <div style={{ fontFamily: 'Inter, system-ui', fontWeight: 500, fontSize: 13, color: 'var(--hof-text)' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, color: 'var(--hof-text-sec)', marginTop: 2 }}>
          {description}
        </div>
      </div>
    </button>
  );
}

export function MemberEditModal({ open, memberId, onClose, onSaved }: MemberEditModalProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [member, setMember] = useState<MemberRecord | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [photographer, setPhotographer] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !memberId) {
      setMember(null);
      setAvatarUrl(null);
      setAvatarPreview(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    void fetch(`/api/admin/members/${memberId}`)
      .then(async (res) => {
        const data = (await res.json()) as { member?: MemberRecord; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Failed to load member');
        const m = data.member;
        if (!m) throw new Error('Member not found');
        setMember(m);
        setDisplayName(m.display_name);
        setHandle(m.handle);
        setEmail(m.email ?? '');
        setRole(m.role);
        setPhotographer(m.settings?.photographer === true);
        setFlagged(m.settings?.flagged === true);
        setAvatarUrl(m.avatar_url);
        setAvatarPreview(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load member');
        setMember(null);
      })
      .finally(() => setLoading(false));
  }, [open, memberId]);

  if (!open) return null;

  const initials = displayName
    .split(' ')
    .map((s) => s[0] ?? '')
    .join('')
    .slice(0, 2);

  async function handleAvatarSelect(file: File | undefined) {
    if (!file || !memberId) return;

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    setError(null);

    try {
      const publicUrl = await uploadMemberAvatar(memberId, file);
      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      setMember((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
      onSaved();
    } catch (err) {
      setAvatarPreview(null);
      setError(err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(preview);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleRemoveAvatar() {
    if (!memberId || avatarUploading) return;

    setAvatarUploading(true);
    setError(null);

    try {
      await removeMemberAvatar(memberId);
      setAvatarUrl(null);
      setAvatarPreview(null);
      setMember((prev) => (prev ? { ...prev, avatar_url: null } : prev));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;

    setSaving(true);
    setError(null);

    const payload: MemberUpdatePayload = {
      display_name: displayName,
      handle,
      email,
      role,
      photographer,
      flagged,
    };

    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { member?: MemberRecord; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
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
          width: 'min(560px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--hof-surface)',
          border: '1px solid var(--hof-border)',
          borderRadius: 14,
          color: 'var(--hof-text)',
          fontFamily: 'Inter, system-ui',
        }}
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--hof-border)',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
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
                fontSize: 22,
                color: 'var(--hof-text)',
                letterSpacing: '-0.01em',
                marginTop: 4,
              }}
            >
              Edit member
            </div>
            {member ? (
              <div style={{ fontSize: 12, color: 'var(--hof-text-sec)', marginTop: 4 }}>
                Joined {formatJoined(member.member_since)} · {member.ticket_count ?? 0} tickets ·{' '}
                {member.post_count ?? 0} posts
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              border: '1px solid var(--hof-border)',
              background: 'var(--hof-elevated)',
              color: 'var(--hof-text-sec)',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 22, color: 'var(--hof-text-sec)', fontSize: 13 }}>Loading member…</div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: '18px 22px 22px' }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Profile photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button
                    type="button"
                    aria-label="Change profile photo"
                    disabled={avatarUploading || saving}
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      position: 'relative',
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      flexShrink: 0,
                      padding: 0,
                      overflow: 'hidden',
                      border: '2px solid var(--hof-border)',
                      background: 'var(--hof-elevated)',
                      cursor: avatarUploading || saving ? 'wait' : 'pointer',
                    }}
                  >
                    {avatarPreview || avatarUrl ? (
                      <img
                        src={avatarPreview ?? avatarUrl ?? ''}
                        alt={displayName || 'Profile photo'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <Avatar initials={initials || 'M'} size={72} />
                    )}
                    {avatarUploading ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--hof-text)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Saving
                      </div>
                    ) : null}
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      disabled={avatarUploading || saving}
                      onClick={() => avatarInputRef.current?.click()}
                      style={{
                        height: 36,
                        padding: '0 14px',
                        borderRadius: 8,
                        border: '1px solid var(--hof-border)',
                        background: 'var(--hof-elevated)',
                        color: 'var(--hof-text)',
                        fontFamily: 'Inter, system-ui',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: avatarUploading || saving ? 'wait' : 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Upload photo
                    </button>
                    {(avatarUrl || avatarPreview) && !avatarUploading ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleRemoveAvatar()}
                        style={{
                          height: 36,
                          padding: '0 14px',
                          borderRadius: 8,
                          border: '1px solid var(--hof-border)',
                          background: 'transparent',
                          color: 'var(--hof-text-sec)',
                          fontFamily: 'Inter, system-ui',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: saving ? 'wait' : 'pointer',
                          alignSelf: 'flex-start',
                        }}
                      >
                        Remove photo
                      </button>
                    ) : null}
                    <div style={{ fontSize: 11, color: 'var(--hof-text-sec)', maxWidth: 220 }}>
                      JPG, PNG, or WebP · max 50 MB
                    </div>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    style={{ display: 'none' }}
                    onChange={(e) => void handleAvatarSelect(e.target.files?.[0])}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Display name *</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={saving}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Handle *</label>
                <input
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  disabled={saving}
                  style={inputStyle}
                  placeholder="member_handle"
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  style={inputStyle}
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  disabled={saving}
                  style={inputStyle}
                >
                  <option value="member">Member</option>
                  <option value="crew">Crew</option>
                  <option value="admin">Owner (admin)</option>
                </select>
              </div>

              <ToggleRow
                label="Photographer"
                description="Shows the photographer badge on this member profile."
                checked={photographer}
                onChange={setPhotographer}
                disabled={saving}
              />

              <ToggleRow
                label="Flagged"
                description="Marks this member for moderation review."
                checked={flagged}
                onChange={setFlagged}
                disabled={saving}
              />
            </div>

            {error ? (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(232,74,26,0.1)',
                  border: '1px solid rgba(232,74,26,0.3)',
                  fontSize: 13,
                  color: 'var(--hof-error)',
                }}
              >
                {error}
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving || avatarUploading}
                style={{
                  height: 40,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: '1px solid var(--hof-border)',
                  background: 'var(--hof-elevated)',
                  color: 'var(--hof-text-sec)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || avatarUploading || !displayName.trim() || !handle.trim()}
                style={{
                  height: 40,
                  padding: '0 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--hof-amber)',
                  color: 'var(--hof-bg)',
                  fontFamily: 'Inter, system-ui',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
