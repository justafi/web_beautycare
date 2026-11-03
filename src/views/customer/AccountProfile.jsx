'use client';
import { useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Button, Card, Field, Input, PageHeader } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { validatePassword } from '../public/Register.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+62|62|0)8\d{7,12}$/;

function useSubmit(toast, setUser) {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const run = async (fn, successMsg) => {
    setLoading(true); setErrors({});
    try { const r = await fn(); if (r?.data?.user) setUser((u) => ({ ...u, ...r.data.user })); toast.success(successMsg); return true; }
    catch (e) { const p = parseError(e); setErrors(p.fields); toast.error(p.message); return false; }
    finally { setLoading(false); }
  };
  return { errors, setErrors, loading, run };
}

// Dipakai bersama oleh pelanggan dan staf.
export default function AccountProfile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [p, setP] = useState({ name: user.name, phone: user.phone });
  const [em, setEm] = useState({ email: user.email, current_password: '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const prof = useSubmit(toast, setUser);
  const mail = useSubmit(toast, setUser);
  const pass = useSubmit(toast, setUser);

  const saveProfile = (e) => {
    e.preventDefault();
    const err = {};
    if (p.name.trim().length < 2) err.name = 'Nama minimal 2 karakter';
    if (!PHONE_RE.test(p.phone)) err.phone = 'Nomor telepon tidak valid';
    prof.setErrors(err);
    if (!Object.keys(err).length) prof.run(() => api.put('/auth/me', { name: p.name.trim(), phone: p.phone }), 'Profil diperbarui.');
  };
  const saveEmail = async (e) => {
    e.preventDefault();
    const err = {};
    if (!EMAIL_RE.test(em.email)) err.email = 'Email tidak valid';
    if (!em.current_password) err.current_password = 'Masukkan password saat ini';
    mail.setErrors(err);
    if (!Object.keys(err).length && await mail.run(() => api.put('/auth/me/email', em), 'Email diperbarui.')) setEm({ ...em, current_password: '' });
  };
  const savePass = async (e) => {
    e.preventDefault();
    const err = {};
    if (!pw.current_password) err.current_password = 'Masukkan password saat ini';
    const pe = validatePassword(pw.new_password);
    if (pe) err.new_password = pe;
    if (pw.new_password !== pw.confirm) err.confirm = 'Konfirmasi password tidak sama';
    pass.setErrors(err);
    if (!Object.keys(err).length && await pass.run(() => api.put('/auth/me/password', { current_password: pw.current_password, new_password: pw.new_password }), 'Password diubah.')) setPw({ current_password: '', new_password: '', confirm: '' });
  };

  return (
    <>
      <PageHeader title="Profil" subtitle="Kelola data akun Anda." />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-2xl">Data diri</h2>
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <Field label="Nama" error={prof.errors.name}><Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
            <Field label="Nomor telepon" error={prof.errors.phone}><Input type="tel" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
            <Button type="submit" loading={prof.loading}>Simpan</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-2xl">Ganti email</h2>
          <form onSubmit={saveEmail} className="space-y-4" noValidate>
            <Field label="Email baru" error={mail.errors.email}><Input type="email" value={em.email} onChange={(e) => setEm({ ...em, email: e.target.value })} /></Field>
            <Field label="Password saat ini" error={mail.errors.current_password}><Input type="password" autoComplete="current-password" value={em.current_password} onChange={(e) => setEm({ ...em, current_password: e.target.value })} /></Field>
            <Button type="submit" variant="outline" loading={mail.loading}>Ganti email</Button>
          </form>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-2xl">Ganti password</h2>
          <form onSubmit={savePass} className="grid gap-4 sm:grid-cols-3" noValidate>
            <Field label="Password saat ini" error={pass.errors.current_password}><Input type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
            <Field label="Password baru" error={pass.errors.new_password}><Input type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Field>
            <Field label="Ulangi password baru" error={pass.errors.confirm}><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <div className="sm:col-span-3"><Button type="submit" variant="outline" loading={pass.loading}>Ganti password</Button></div>
          </form>
        </Card>
      </div>
    </>
  );
}
