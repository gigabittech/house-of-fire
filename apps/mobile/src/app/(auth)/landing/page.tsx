import { getLiveEvent } from '@/lib/liveEvent.server';
import { createServerSupabaseClient } from '@/lib/supabase.server';
import LandingScreen from '@/screens/LandingScreen';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: liveEvent } = await getLiveEvent(supabase, 'id');

  return <LandingScreen hasLiveEvent={Boolean(liveEvent)} />;
}
