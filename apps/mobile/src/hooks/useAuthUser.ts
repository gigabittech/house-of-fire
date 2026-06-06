'use client';

import type { HofAppHeaderUser } from '@hof/ui';
import { useEffect, useState } from 'react';
import { PROFILE_UPDATED_EVENT } from '@/lib/profileCache';
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
        .select('display_name, avatar_url')
        .eq('id', authUser.id)
        .maybeSingle();

      const name =
        profile?.display_name?.trim() ||
        authUser.user_metadata?.full_name ||
        authUser.email.split('@')[0] ||
        'Member';

      setUser({
        name,
        email: authUser.email,
        avatarUrl: profile?.avatar_url ?? null,
      });
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    const onProfileUpdated = () => {
      void load();
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, []);

  return user;
}
