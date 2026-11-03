import { Suspense } from 'react';
import View from '@/views/public/Login';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <View />
    </Suspense>
  );
}
