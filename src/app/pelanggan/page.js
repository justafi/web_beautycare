import { Suspense } from 'react';
import View from '@/views/customer/NewReservation';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <View />
    </Suspense>
  );
}
