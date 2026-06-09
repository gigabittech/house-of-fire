import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  mergeMemberSettings,
  normalizeHandle,
  type MemberRecord,
  type MemberUpdatePayload,
  validateMemberUpdate,
} from '@/lib/memberPayload';
import { requireAdminRole } from '@/lib/requireAdminRole';
import { createAdminSupabaseClient } from '@/lib/supabase.admin';

async function loadMemberRecord(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  id: string,
): Promise<MemberRecord | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, member_since, role, settings, avatar_url')
    .eq('id', id)
    .maybeSingle();

  if (error || !profile) return null;

  const { data: authUser } = await supabase.auth.admin.getUserById(id);

  const { count: ticketCount } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('holder_id', id)
    .in('status', ['valid', 'used', 'transferred']);

  const { count: postCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', id);

  return {
    id: profile.id,
    handle: profile.handle,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    member_since: profile.member_since,
    role: profile.role as MemberRecord['role'],
    settings: (profile.settings as MemberRecord['settings']) ?? null,
    email: authUser?.user?.email ?? null,
    ticket_count: ticketCount ?? 0,
    post_count: postCount ?? 0,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const member = await loadMemberRecord(supabase, id);

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  return NextResponse.json({ member });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as MemberUpdatePayload;
  const validationError = validateMemberUpdate(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (body.role === 'admin' && auth.role !== 'admin') {
    return NextResponse.json({ error: 'Only owners can assign the admin role' }, { status: 403 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, handle, settings, role')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (body.handle !== undefined) {
    const handle = normalizeHandle(body.handle);
    const { data: conflict } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .neq('id', id)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
    }
  }

  const profileUpdates: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    profileUpdates.display_name = body.display_name.trim();
  }
  if (body.handle !== undefined) {
    profileUpdates.handle = normalizeHandle(body.handle);
  }
  if (body.role !== undefined) {
    profileUpdates.role = body.role;
  }
  if (body.photographer !== undefined || body.flagged !== undefined) {
    profileUpdates.settings = mergeMemberSettings(
      (existing.settings as MemberRecord['settings']) ?? null,
      {
        photographer: body.photographer,
        flagged: body.flagged,
      },
    );
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: updateError } = await supabase.from('profiles').update(profileUpdates).eq('id', id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  if (body.email !== undefined && body.email.trim()) {
    const { error: emailError } = await supabase.auth.admin.updateUserById(id, {
      email: body.email.trim(),
    });
    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }
  }

  const member = await loadMemberRecord(supabase, id);
  return NextResponse.json({ member });
}
