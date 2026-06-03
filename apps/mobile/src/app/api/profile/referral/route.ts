import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase.server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('referral_code, display_name')
    .eq('id', user.id)
    .single();

  if (profileError ?? !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  let referralCode = profile.referral_code;

  // Generate a code if one doesn't exist yet
  if (!referralCode) {
    const prefix = profile.display_name
      .slice(0, 2)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, 'X');
    const suffix = user.id.replace(/-/g, '').slice(-4).toUpperCase();
    referralCode = `HOF-${prefix}${suffix}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referral_code: referralCode })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const { count: referralCount, error: countError } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { count: conversions, error: convError } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('converted', true);

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  return NextResponse.json({
    referral_code: referralCode,
    referral_count: referralCount ?? 0,
    conversions: conversions ?? 0,
  });
}
