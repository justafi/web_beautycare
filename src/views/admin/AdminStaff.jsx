'use client';
import { Pencil, Plus, Power, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, SmartImage, Spinner, Textarea } from '../../components/ui.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DAY_NAMES } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+62|62|0)8\d{7,12}$/;
const defaultSchedules = () => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day_of_week: d, start_time: '09:00', end_time: '17:00', is_off: d === 0 ? 1 : 0 }));
const EMPTY = { name: '', email: '', phone: '', password: '', title: '', specialization: '', bio: '', photo_path: null, can_manage_availability: 0, service_ids: [], schedules: defaultSchedules() };

export default function AdminStaff() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/staff');
  const svc = useFetch('/admin/services');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toggleT, setToggleT] = useState(null);
  const [brk, setBrk] = useState({ day_of_week: '', start_time: '12:00', end_time: '13:00', label: 'Istirahat' });

  const open = (s) => {
    setErrors({});
    if (!s) return setForm(EMPTY);
    const sched = defaultSchedules().map((d) => s.schedules.find((x) => x.day_of_week === d.day_of_week) || { ...d, is_off: 1 });
    setForm({ ...s, password: '', bio: s.bio || '', schedules: sched });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setSched = (i, patch) => setForm({ ...form, schedules: form.schedules.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const save = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter';
    if (!EMAIL_RE.test(form.email)) e.email = 'Email tidak valid';
    if (!PHONE_RE.test(form.phone)) e.phone = 'Nomor telepon tidak valid';
    if (!form.title.trim()) e.title = 'Jabatan wajib diisi';
    if (!form.specialization.trim()) e.specialization = 'Spesialisasi wajib diisi';
    if (!form.id && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) e.password = 'Minimal 8 karakter, huruf dan angka';
    if (form.id && form.password && (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) e.password = 'Minimal 8 karakter, huruf dan angka';
    if (form.schedules.some((s) => !s.is_off && s.end_time <= s.start_time)) e.schedules = 'Jam selesai harus setelah jam mulai';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const body = { ...form, password: form.password || undefined };
      delete body.breaks; delete body.id; delete body.user_id; delete body.is_active;
      if (form.id) await api.put(`/admin/staff/${form.id}`, body); else await api.post('/admin/staff', body);
      toast.success(form.id ? 'Data staf diperbarui.' : 'Akun staf dibuat.');
      setForm(null); reload();
    } catch (ex) { const p = parseError(ex); setErrors(p.fields); toast.error(p.message); } finally { setSaving(false); }
  };
  const toggle = async () => {
    try { await api.patch(`/admin/staff/${toggleT.id}/active`, { is_active: toggleT.is_active ? 0 : 1 }); toast.success(toggleT.is_active ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.'); setToggleT(null); reload(); }
    catch (ex) { toast.error(parseError(ex).message); setToggleT(null); }
  };
  const addBreak = async () => {
    if (brk.end_time <= brk.start_time) return toast.error('Jam selesai harus setelah jam mulai.');
    try {
      await api.post(`/admin/staff/${form.id}/breaks`, { ...brk, day_of_week: brk.day_of_week === '' ? null : Number(brk.day_of_week) });
      toast.success('Waktu istirahat ditambahkan.');
      const fresh = (await api.get('/admin/staff')).data.staff.find((s) => s.id === form.id);
      setForm({ ...form, breaks: fresh.breaks }); reload();
    } catch (ex) { toast.error(parseError(ex).message); }
  };
  const delBreak = async (id) => {
    try {
      await api.delete(`/admin/staff/${form.id}/breaks/${id}`);
      setForm({ ...form, breaks: form.breaks.filter((b) => b.id !== id) }); reload();
    } catch (ex) { toast.error(parseError(ex).message); }
  };
  const toggleService = (id) => setForm({ ...form, service_ids: form.service_ids.includes(id) ? form.service_ids.filter((x) => x !== id) : [...form.service_ids, id] });

  const list = data?.staff || [];
  return (
    <>
      <PageHeader title="Staf & terapis" subtitle="Kelola akun, layanan yang ditangani, jadwal kerja, dan waktu istirahat." actions={<Button onClick={() => open(null)}><Plus className="h-4 w-4" />Tambah staf</Button>} />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? <EmptyState icon={Users} title="Belum ada staf" text="Tambahkan terapis pertama Anda." /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start gap-4">
                <SmartImage src={s.photo_url} alt={s.name} className="h-16 w-16 shrink-0 rounded-full" iconSize="h-6 w-6" />
                <div className="min-w-0 flex-1"><h2 className="truncate text-2xl">{s.name}</h2><p className="text-sm text-rose-700">{s.title}</p><p className="truncate text-xs text-mist">{s.email}</p></div>
                <Badge className={s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}>{s.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
              </div>
              <p className="mt-3 text-sm text-mist">{s.specialization}</p>
              <p className="mt-1 text-xs text-mist">{s.service_ids.length} layanan · {s.schedules.filter((x) => !x.is_off).length} hari kerja{s.can_manage_availability ? ' · bisa atur istirahat' : ''}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => open(s)}><Pencil className="h-4 w-4" />Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setToggleT(s)}><Power className="h-4 w-4" />{s.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} wide title={form?.id ? 'Edit staf' : 'Tambah staf'}>
        {form && (
          <form onSubmit={save} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama" error={errors.name}><Input value={form.name} onChange={set('name')} /></Field>
              <Field label="Email (untuk login)" error={errors.email}><Input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label="Telepon" error={errors.phone}><Input type="tel" value={form.phone} onChange={set('phone')} /></Field>
              <Field label={form.id ? 'Password baru (opsional)' : 'Password awal'} error={errors.password}><Input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
              <Field label="Jabatan" error={errors.title}><Input value={form.title} onChange={set('title')} /></Field>
              <Field label="Spesialisasi" error={errors.specialization}><Input value={form.specialization} onChange={set('specialization')} /></Field>
            </div>
            <Field label="Bio singkat"><Textarea value={form.bio} onChange={set('bio')} /></Field>
            <ImageUpload folder="staff" label="Foto profil" value={form.photo_path} onChange={(p) => setForm({ ...form, photo_path: p })} />

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Layanan yang dapat ditangani</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(svc.data?.services || []).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose-600" checked={form.service_ids.includes(s.id)} onChange={() => toggleService(s.id)} />{s.name}{!s.is_active && <span className="text-xs text-mist">(nonaktif)</span>}</label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Jadwal kerja & hari libur</legend>
              <div className="space-y-2">
                {form.schedules.map((s, i) => (
                  <div key={s.day_of_week} className="grid grid-cols-[5rem_1fr_1fr_auto] items-center gap-2 text-sm">
                    <span>{DAY_NAMES[s.day_of_week]}</span>
                    <Input type="time" aria-label={`Mulai ${DAY_NAMES[s.day_of_week]}`} disabled={!!s.is_off} value={s.start_time} onChange={(e) => setSched(i, { start_time: e.target.value })} />
                    <Input type="time" aria-label={`Selesai ${DAY_NAMES[s.day_of_week]}`} disabled={!!s.is_off} value={s.end_time} onChange={(e) => setSched(i, { end_time: e.target.value })} />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="accent-rose-600" checked={!!s.is_off} onChange={(e) => setSched(i, { is_off: e.target.checked ? 1 : 0 })} />Libur</label>
                  </div>
                ))}
              </div>
              {errors.schedules && <p className="mt-1 text-xs text-red-700" role="alert">{errors.schedules}</p>}
            </fieldset>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose-600" checked={!!form.can_manage_availability} onChange={(e) => setForm({ ...form, can_manage_availability: e.target.checked ? 1 : 0 })} />Izinkan staf mengatur waktu istirahat sendiri</label>

            {form.id ? (
              <fieldset className="rounded-2xl bg-blush-50 p-4">
                <legend className="px-1 text-sm font-medium">Waktu istirahat</legend>
                {form.breaks.length === 0 ? <p className="text-sm text-mist">Belum ada waktu istirahat.</p> : (
                  <ul className="mb-3 space-y-1 text-sm">
                    {form.breaks.map((b) => <li key={b.id} className="flex items-center justify-between"><span>{b.label}: {b.day_of_week === null ? 'setiap hari' : DAY_NAMES[b.day_of_week]}, {b.start_time}–{b.end_time}</span><button type="button" aria-label="Hapus istirahat" onClick={() => delBreak(b.id)} className="rounded-full p-1 hover:bg-white"><Trash2 className="h-4 w-4" /></button></li>)}
                  </ul>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Select aria-label="Hari istirahat" value={brk.day_of_week} onChange={(e) => setBrk({ ...brk, day_of_week: e.target.value })}><option value="">Setiap hari</option>{DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select>
                  <Input type="time" aria-label="Mulai istirahat" value={brk.start_time} onChange={(e) => setBrk({ ...brk, start_time: e.target.value })} />
                  <Input type="time" aria-label="Selesai istirahat" value={brk.end_time} onChange={(e) => setBrk({ ...brk, end_time: e.target.value })} />
                  <Input aria-label="Keterangan" value={brk.label} onChange={(e) => setBrk({ ...brk, label: e.target.value })} />
                  <Button type="button" variant="outline" onClick={addBreak}>Tambah</Button>
                </div>
              </fieldset>
            ) : <p className="text-xs text-mist">Waktu istirahat dapat ditambahkan setelah akun dibuat.</p>}

            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setForm(null)}>Batal</Button><Button type="submit" loading={saving}>Simpan</Button></div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!toggleT} onClose={() => setToggleT(null)} onConfirm={toggle} danger={!!toggleT?.is_active} title={toggleT?.is_active ? 'Nonaktifkan akun staf?' : 'Aktifkan akun staf?'}
        message={toggleT?.is_active ? `${toggleT.name} tidak akan bisa login dan tidak muncul untuk reservasi baru. Reservasi yang sudah ada tidak berubah; ubah jadwalnya bila perlu.` : `${toggleT?.name} akan bisa login dan menerima reservasi lagi.`} />
    </>
  );
}
