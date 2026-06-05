'use client';

import { COMMUNITY_FEATURE_ENABLED } from '@/lib/features';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/** Redirects away from /community routes when Community is disabled. */
export function CommunityFeatureGate({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!COMMUNITY_FEATURE_ENABLED) router.replace('/');
  }, [router]);

  if (!COMMUNITY_FEATURE_ENABLED) return null;
  return children;
}
