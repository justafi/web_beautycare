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
          <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password" error={errors.password}><Input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Button type="submit" className="w-full" loading={loading}>Masuk</Button>
        </form>
        <p className="mt-5 text-center text-sm text-mist">Belum punya akun? <Link href="/daftar" className="font-medium text-rose-700 hover:underline">Daftar</Link></p>
      </Card>
    </div>
  );
}
