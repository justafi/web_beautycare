import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/Layouts';
import { homeFor } from '@/lib/roles';
import { getProfile } from '@/lib/supabase/server';

export default async function Layout({ children }) {
  const user = await getProfile();
  if (!user) redirect('/masuk');
  if (user.role !== 'customer') redirect(homeFor(user.role));
  return <DashboardLayout role="customer">{children}</DashboardLayout>;
}
