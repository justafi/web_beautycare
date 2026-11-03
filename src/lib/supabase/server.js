import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fetchProfile } from '@/lib/profile';

export function createClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* dipanggil dari Server Component: middleware yang menyegarkan sesi */ }
      },
    },
  });
}

export const getProfile = () => fetchProfile(createClient());
