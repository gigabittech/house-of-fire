import { Suspense } from 'react';
import { AuthRouteLoading } from '@/components/auth/AuthRouteLoading';
import OnboardingScreen from '@/screens/OnboardingScreen';

export default function Page() {
  return (
    <Suspense fallback={<AuthRouteLoading />}>
      <OnboardingScreen />
    </Suspense>
  );
}
