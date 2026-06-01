import { Suspense } from 'react';
import CheckoutScreen from '../../screens/CheckoutScreen.js';

export default function Page() {
  return (
    <Suspense>
      <CheckoutScreen />
    </Suspense>
  );
}
