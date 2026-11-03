'use client';
import { Clock, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Input, PageHeader, Select, Spinner } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DAY_NAMES } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

export default function StaffAvailability() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/staff-me/breaks');
  const [f, setF] = useState({ day_of_week: '', start_time: '12:00', end_time: '13:00', label: 'Istirahat' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    if (f.end_time <= f.start_time) return setErrors({ end_time: 'Jam selesai harus setelah jam mulai' });
    setSaving(true); setErrors({});
    try {
      await api.post('/staff-me/breaks', { ...f, day_of_week: f.day_of_week === '' ? null : Number(f.day_of_week) });
      toast.success('Waktu istirahat ditambahkan.'); reload();
    } catch (ex) { const p = parseError(ex); setErrors(p.fields); toast.error(p.message); } finally { setSaving(false); }
  };
  const remove = async () => {
    try { await api.delete(`/staff-me/breaks/${del.id}`); toast.success('Waktu istirahat dihapus.'); setDel(null); reload(); }
    catch (ex) { toast.error(parseError(ex).message); setDel(null); }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const can = data.can_manage;
  return (
    <>
      <PageHeader title="Ketersediaan" subtitle="Waktu istirahat memblokir slot reservasi pada jam tersebut." />
      {!can && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-blush-50 p-4 text-sm text-mist">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Anda belum diberi izin mengubah ketersediaan. Hubungi admin jika perlu menyesuaikan waktu istirahat.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          {data.breaks.length === 0 ? <EmptyState icon={Clock} title="Belum ada waktu istirahat" /> : (
            <Card className="divide-y divide-blush-100 p-0">
              {data.breaks.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div><p className="font-medium">{b.label}</p><p className="text-mist">{b.day_of_week === null ? 'Setiap hari kerja' : DAY_NAMES[b.day_of_week]}, {b.start_time} – {b.end_time}</p></div>
                  {can && <Button variant="ghost" size="sm" aria-label={`Hapus ${b.label}`} onClick={() => setDel(b)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              ))}
            </Card>
          )}
        </div>
        {can && (
          <Card>
            <h2 className="mb-3 text-2xl">Tambah istirahat</h2>
            <form onSubmit={add} className="space-y-3" noValidate>
              <Field label="Hari"><Select value={f.day_of_week} onChange={(e) => setF({ ...f, day_of_week: e.target.value })}><option value="">Setiap hari kerja</option>{DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mulai"><Input type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} /></Field>
                <Field label="Selesai" error={errors.end_time}><Input type="time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} /></Field>
              </div>
              <Field label="Keterangan"><Input maxLength={60} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
              <Button type="submit" loading={saving} className="w-full">Tambah</Button>
            </form>
          </Card>
        )}
      </div>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} danger confirmText="Hapus" title="Hapus waktu istirahat?" message="Slot pada jam tersebut akan kembali tersedia untuk reservasi." />
    </>
  );
}
