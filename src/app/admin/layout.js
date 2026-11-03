import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/Layouts';
import { homeFor } from '@/lib/roles';
import { getProfile } from '@/lib/supabase/server';

// Pemeriksaan role di server; keamanan data tetap dijamin RLS di database.
export default async function Layout({ children }) {
  const user = await getProfile();
  if (!user) redirect('/masuk');
  if (user.role !== 'admin') redirect(homeFor(user.role));
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
