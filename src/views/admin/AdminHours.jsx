'use client';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Button, Card, ConfirmDialog, ErrorState, Field, Input, PageHeader, Spinner } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DAY_NAMES, formatDate } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function AdminHours() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/admin/hours');
  const [hours, setHours] = useState(null);
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [hol, setHol] = useState({ date: '', name: '' });
  const [delHol, setDelHol] = useState(null);

  useEffect(() => { if (data) { setHours(data.hours.map((h) => ({ ...h }))); setS({ ...data.settings }); } }, [data]);

  const save = async (e) => {
    e.preventDefault();
    const err = {};
    hours.forEach((h) => { if (!h.is_closed && h.close_time <= h.open_time) err[`h${h.day_of_week}`] = 'Jam tutup harus setelah jam buka'; });
    if (!(s.slot_interval_min >= 5 && s.slot_interval_min <= 240)) err.slot = 'Interval 5–240 menit';
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    try {
      await api.put('/admin/hours', { hours, ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v)])) });
      toast.success('Pengaturan disimpan.'); reload();
    } catch (ex) { toast.error(parseError(ex).message); } finally { setSaving(false); }
  };
  const addHoliday = async (e) => {
    e.preventDefault();
    if (!hol.date || hol.name.trim().length < 2) return toast.error('Isi tanggal dan nama hari libur.');
    try { await api.post('/admin/holidays', hol); toast.success('Hari libur ditambahkan.'); setHol({ date: '', name: '' }); reload(); }
    catch (ex) { toast.error(parseError(ex).message); }
  };
  const removeHoliday = async () => {
    try { await api.delete(`/admin/holidays/${delHol.id}`); toast.success('Hari libur dihapus.'); setDelHol(null); reload(); }
    catch (ex) { toast.error(parseError(ex).message); setDelHol(null); }
  };

  if (loading && !hours) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!hours || !s) return null;
  const setH = (d, patch) => setHours(hours.map((h) => (h.day_of_week === d ? { ...h, ...patch } : h)));
  const num = (k) => (e) => setS({ ...s, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Jam operasional" subtitle="Jam buka, interval slot, dan aturan pembatalan berlaku langsung untuk reservasi baru." />
      <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1.2fr_1fr]" noValidate>
        <Card>
          <h2 className="mb-4 text-2xl">Jam buka per hari</h2>
          <div className="space-y-3">
            {ORDER.map((d) => {
              const h = hours.find((x) => x.day_of_week === d);
              return (
                <div key={d}>
                  <div className="grid grid-cols-[5rem_1fr_1fr_auto] items-center gap-2 text-sm">
                    <span>{DAY_NAMES[d]}</span>
                    <Input type="time" aria-label={`Buka ${DAY_NAMES[d]}`} disabled={!!h.is_closed} value={h.open_time} onChange={(e) => setH(d, { open_time: e.target.value })} />
                    <Input type="time" aria-label={`Tutup ${DAY_NAMES[d]}`} disabled={!!h.is_closed} value={h.close_time} onChange={(e) => setH(d, { close_time: e.target.value })} />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="accent-rose-600" checked={!!h.is_closed} onChange={(e) => setH(d, { is_closed: e.target.checked ? 1 : 0 })} />Tutup</label>
                  </div>
                  {errors[`h${d}`] && <p className="mt-1 text-xs text-red-700" role="alert">{errors[`h${d}`]}</p>}
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-2xl">Aturan reservasi</h2>
          <div className="space-y-4">
            <Field label="Interval slot (menit)" error={errors.slot} hint="Jarak antar pilihan jam mulai."><Input type="number" min={5} max={240} value={s.slot_interval_min} onChange={num('slot_interval_min')} /></Field>
            <Field label="Batas pembatalan (jam sebelum jadwal)" hint="Pelanggan tidak dapat membatalkan setelah batas ini. Admin tetap dapat."><Input type="number" min={0} value={s.cancel_before_hours} onChange={num('cancel_before_hours')} /></Field>
            <Field label="Batas ubah jadwal (jam sebelum jadwal)"><Input type="number" min={0} value={s.reschedule_before_hours} onChange={num('reschedule_before_hours')} /></Field>
            <Field label="Pemesanan minimal (menit dari sekarang)" hint="Berlaku untuk reservasi di hari yang sama."><Input type="number" min={0} value={s.min_lead_minutes} onChange={num('min_lead_minutes')} /></Field>
            <Field label="Pemesanan maksimal (hari ke depan)"><Input type="number" min={1} max={365} value={s.max_advance_days} onChange={num('max_advance_days')} /></Field>
          </div>
          <Button type="submit" className="mt-6 w-full" loading={saving}>Simpan pengaturan</Button>
        </Card>
      </form>

      <Card className="mt-6">
        <h2 className="mb-4 text-2xl">Hari libur</h2>
        <form onSubmit={addHoliday} className="mb-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto]">
          <Input type="date" aria-label="Tanggal libur" value={hol.date} onChange={(e) => setHol({ ...hol, date: e.target.value })} />
          <Input aria-label="Nama hari libur" placeholder="Nama hari libur" maxLength={100} value={hol.name} onChange={(e) => setHol({ ...hol, name: e.target.value })} />
          <Button type="submit" variant="outline"><Plus className="h-4 w-4" />Tambah</Button>
        </form>
        {data.holidays.length === 0 ? <p className="flex items-center gap-2 text-sm text-mist"><CalendarOff className="h-4 w-4" aria-hidden />Belum ada hari libur.</p> : (
          <ul className="divide-y divide-blush-100 text-sm">
            {data.holidays.map((h) => <li key={h.id} className="flex items-center justify-between py-2"><span>{formatDate(h.date)} · {h.name}</span><Button variant="ghost" size="sm" aria-label={`Hapus ${h.name}`} onClick={() => setDelHol(h)}><Trash2 className="h-4 w-4" /></Button></li>)}
          </ul>
        )}
      </Card>
      <ConfirmDialog open={!!delHol} onClose={() => setDelHol(null)} onConfirm={removeHoliday} danger confirmText="Hapus" title="Hapus hari libur?" message="Tanggal tersebut akan kembali dapat dipesan." />
    </>
  );
}
