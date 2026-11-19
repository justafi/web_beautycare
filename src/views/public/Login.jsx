'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { parseError } from '../../api/client.js';
import { Button, Card, Field, Input } from '../../components/ui.jsx';
import { homeFor, useAuth } from '../../context/AuthContext.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { user, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) router.replace(homeFor(user.role)); }, [user, router]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return; // cegah klik berulang
    const err = {};
    if (!EMAIL_RE.test(form.email)) err.email = 'Masukkan email yang valid';
    if (!form.password) err.password = 'Password wajib diisi';
    setErrors(err); setFormError('');
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      // hanya terima tujuan internal milik role pelanggan; selain itu ke dashboard sesuai role
      const safe = next && next.startsWith('/pelanggan') ? next : null;
      router.replace(u.role === 'customer' && safe ? safe : homeFor(u.role));
    } catch (ex) {
      const p = parseError(ex);
      setFormError(p.message); setErrors(p.fields);
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-10">
      <Card className="w-full p-8">
        <h1 className="text-4xl">Masuk</h1>
        <p className="mt-1 text-sm text-mist">Masuk untuk membuat dan memantau reservasi.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {formError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{formError}</p>}
          <Field label="Email" error={errors.email}>
            <Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-mist transition-colors hover:text-rose-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </Field>
          <Button type="submit" className="w-full" loading={loading}>Masuk</Button>
        </form>
        <p className="mt-5 text-center text-sm text-mist">Belum punya akun? <Link href="/daftar" className="font-medium text-rose-700 hover:underline">Daftar</Link></p>
      </Card>
    </div>
  );
}