'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { parseError } from '../../api/client.js';
import { Button, Card, Field, Input } from '../../components/ui.jsx';
import { homeFor, useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+62|62|0)8\d{7,12}$/;

export function validatePassword(p) {
  if (p.length < 8) return 'Password minimal 8 karakter';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Password harus mengandung huruf dan angka';
  return '';
}

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (user) router.replace(homeFor(user.role)); }, [user, router]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const err = {};
    if (form.name.trim().length < 2) err.name = 'Nama minimal 2 karakter';
    if (!EMAIL_RE.test(form.email)) err.email = 'Masukkan email yang valid';
    if (!PHONE_RE.test(form.phone)) err.phone = 'Nomor telepon tidak valid (contoh: 081234567890)';
    const pe = validatePassword(form.password);
    if (pe) err.password = pe;
    setErrors(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const r = await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      if (r.needsConfirmation) {
        toast.success('Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.');
        router.replace('/masuk');
      } else {
        toast.success('Akun berhasil dibuat. Selamat datang!');
        router.replace('/pelanggan');
      }
    } catch (ex) {
      const p = parseError(ex);
      setErrors(Object.keys(p.fields).length ? p.fields : { _: p.message });
      toast.error(p.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-10">
      <Card className="w-full p-8">
        <h1 className="text-4xl">Buat akun</h1>
        <p className="mt-1 text-sm text-mist">Daftar sebagai pelanggan untuk mulai reservasi.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <Field label="Nama lengkap" error={errors.name}><Input autoComplete="name" value={form.name} onChange={set('name')} /></Field>
          <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Nomor telepon" error={errors.phone}><Input type="tel" autoComplete="tel" placeholder="081234567890" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Password" error={errors.password} hint="Minimal 8 karakter, kombinasi huruf dan angka."><Input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
          <Button type="submit" className="w-full" loading={loading}>Daftar</Button>
        </form>
        <p className="mt-5 text-center text-sm text-mist">Sudah punya akun? <Link href="/masuk" className="font-medium text-rose-700 hover:underline">Masuk</Link></p>
      </Card>
    </div>
  );
}
