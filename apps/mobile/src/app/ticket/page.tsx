import { Suspense } from 'react';
import TicketScreen from '../../screens/TicketScreen';

export default function Page() {
  return (
    <Suspense>
      <TicketScreen />
    </Suspense>
  );
}
