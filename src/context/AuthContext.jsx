'use client';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fail } from '@/api/client';
import { fetchProfile } from '@/lib/profile';
import { homeFor } from '@/lib/roles';
import { createClient } from '@/lib/supabase/client';

export { homeFor };
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ initialUser, children }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState(initialUser || null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw fail(401, /confirm/i.test(error.message) ? 'Email belum dikonfirmasi. Cek kotak masuk Anda.' : 'Email atau password salah.');
    const profile = await fetchProfile(supabase);
    if (!profile) {
      await supabase.auth.signOut();
      throw fail(403, 'Akun Anda dinonaktifkan atau belum lengkap. Hubungi admin salon.');
    }
    setUser(profile);
    router.refresh();
    return profile;
  };

  const register = async ({ name, email, phone, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, phone } } });
    if (error) {
      if (/registered|already/i.test(error.message)) throw fail(409, 'Email sudah terdaftar.', { email: 'Email sudah terdaftar' });
      throw fail(422, error.message);
    }
    if (!data.session) return { needsConfirmation: true };
    const profile = await fetchProfile(supabase);
    setUser(profile);
    router.refresh();
    return { user: profile };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return <AuthCtx.Provider value={{ user, setUser, login, register, logout }}>{children}</AuthCtx.Provider>;
}
