import { Suspense } from 'react';
import OnboardingScreen from '../../screens/OnboardingScreen';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingScreen />
    </Suspense>
  );
}
