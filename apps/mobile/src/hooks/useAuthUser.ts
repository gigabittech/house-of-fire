'use client';

import type { HofAppHeaderUser } from '@hof/ui';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export function useAuthUser(): HofAppHeaderUser | null {
  const [user, setUser] = useState<HofAppHeaderUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser?.email) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', authUser.id)
        .maybeSingle();

      const name =
        profile?.display_name?.trim() ||
        authUser.user_metadata?.full_name ||
        authUser.email.split('@')[0] ||
        'Member';

      setUser({ name, email: authUser.email });
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
