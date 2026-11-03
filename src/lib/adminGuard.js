import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchProfile } from '@/lib/profile';

export async function requireAdmin() {
  const profile = await fetchProfile(createClient());
  if (!profile) return { error: NextResponse.json({ message: 'Silakan login terlebih dahulu.' }, { status: 401 }) };
  if (profile.role !== 'admin') return { error: NextResponse.json({ message: 'Anda tidak memiliki akses ke sumber daya ini.' }, { status: 403 }) };
  return { profile };
}
