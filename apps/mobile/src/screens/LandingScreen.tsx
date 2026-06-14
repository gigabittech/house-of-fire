'use client';

import { LandingExperienceView } from '@/components/landing/LandingExperienceView';
import { LandingUpcomingView } from '@/components/landing/LandingUpcomingView';

export interface LandingScreenProps {
  hasLiveEvent: boolean;
}

export default function LandingScreen({ hasLiveEvent }: LandingScreenProps) {
  if (hasLiveEvent) {
    return <LandingExperienceView />;
  }

  return <LandingUpcomingView />;
}
