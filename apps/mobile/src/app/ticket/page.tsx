import { Suspense } from 'react';
import TicketScreen from '../../screens/TicketScreen.js';

export default function Page() {
  return (
    <Suspense>
      <TicketScreen />
    </Suspense>
  );
}
