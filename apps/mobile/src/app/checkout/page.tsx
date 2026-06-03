import { Suspense } from 'react';
import CheckoutScreen from '../../screens/CheckoutScreen';

export default function Page() {
  return (
    <Suspense>
      <CheckoutScreen />
    </Suspense>
  );
}
