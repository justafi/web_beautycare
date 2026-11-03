'use client';
import { Pencil, Plus, Power, Scissors, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Spinner, Textarea } from '../../components/ui.jsx';
import ImageUpload from '../../components/ImageUpload.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

const EMPTY = { name: '', category: '', description: '', price: '', duration_min: 60, photo_path: null, is_active: 1 };

export default function AdminServices() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(search), 300); return () => clearTimeout(t); }, [search]);
  const { data, loading, error, reload } = useFetch('/admin/services', { search: q || undefined, category: category || undefined, status: status || undefined });
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const open = (s) => { setErrors({}); setForm(s ? { ...s, description: s.description || '' } : EMPTY); };
  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter';
    if (form.category.trim().length < 2) e.category = 'Kategori wajib diisi';
    if (form.price === '' || Number(form.price) < 0) e.price = 'Harga tidak valid';
    if (!(Number(form.duration_min) >= 5 && Number(form.duration_min) <= 480)) e.duration_min = 'Durasi 5–480 menit';
    return e;
  };
  const save = async (ev) => {
    ev.preventDefault();
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      if (saving) return;
      const body = { ...form, price: Number(form.price), duration_min: Number(form.duration_min) };
      if (form.id) await api.put(`/admin/services/${form.id}`, body); else await api.post('/admin/services', body);
      toast.success(form.id ? 'Layanan diperbarui.' : 'Layanan ditambahkan.');
      setForm(null); reload();
    } catch (ex) { const p = parseError(ex); setErrors(p.fields); toast.error(p.message); } finally { setSaving(false); }
  };
  const toggle = async (s) => {
    try { await api.patch(`/admin/services/${s.id}/active`, { is_active: s.is_active ? 0 : 1 }); toast.success(s.is_active ? 'Layanan dinonaktifkan.' : 'Layanan diaktifkan.'); reload(); }
    catch (ex) { toast.error(parseError(ex).message); }
  };
  const remove = async () => {
    try { const r = await api.delete(`/admin/services/${del.id}`); toast.success(r.data.message); setDel(null); reload(); }
    catch (ex) { toast.error(parseError(ex).message); setDel(null); }
  };
  const list = data?.services || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Manajemen layanan" subtitle="Perubahan harga tidak memengaruhi reservasi lama (harga disimpan sebagai snapshot)." actions={<Button onClick={() => open(null)}><Plus className="h-4 w-4" />Tambah layanan</Button>} />
      <Card className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-mist" aria-hidden /><Input aria-label="Cari layanan" className="pl-10" placeholder="Cari nama layanan…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select aria-label="Filter kategori" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Semua kategori</option>{(data?.categories || []).map((c) => <option key={c}>{c}</option>)}</Select>
        <Select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></Select>
      </Card>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={Scissors} title="Layanan tidak ditemukan" text="Tambahkan layanan baru atau ubah filter." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-blush-50 text-mist"><tr><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Harga</th><th className="px-4 py-3">Durasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-blush-100">
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.name}</td><td className="px-4 py-3">{s.category}</td><td className="px-4 py-3">{rupiah(s.price)}</td><td className="px-4 py-3">{s.duration_min} mnt</td>
                  <td className="px-4 py-3"><Badge className={s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}>{s.is_active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Edit ${s.name}`} onClick={() => open(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={s.is_active ? `Nonaktifkan ${s.name}` : `Aktifkan ${s.name}`} onClick={() => toggle(s)}><Power className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Hapus ${s.name}`} onClick={() => setDel(s)}><Trash2 className="h-4 w-4" /></Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit layanan' : 'Tambah layanan'}>
        {form && (
          <form onSubmit={save} className="space-y-4" noValidate>
            <Field label="Nama layanan" error={errors.name}><Input value={form.name} onChange={set('name')} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategori" error={errors.category}><Input list="cats" value={form.category} onChange={set('category')} /><datalist id="cats">{(data?.categories || []).map((c) => <option key={c} value={c} />)}</datalist></Field>
              <Field label="Durasi (menit)" error={errors.duration_min}><Input type="number" min={5} max={480} value={form.duration_min} onChange={set('duration_min')} /></Field>
            </div>
            <Field label="Harga (Rp)" error={errors.price}><Input type="number" min={0} step={1000} value={form.price} onChange={set('price')} /></Field>
            <Field label="Deskripsi" error={errors.description}><Textarea value={form.description} onChange={set('description')} /></Field>
            <ImageUpload folder="services" label="Foto layanan" value={form.photo_path} onChange={(p) => setForm({ ...form, photo_path: p })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose-600" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />Layanan aktif (tampil untuk pelanggan)</label>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setForm(null)}>Batal</Button><Button type="submit" loading={saving}>Simpan</Button></div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} danger confirmText="Hapus" title="Hapus layanan?" message={del ? `"${del.name}" akan dihapus. Jika layanan sudah pernah direservasi, layanan hanya dinonaktifkan agar riwayat tetap utuh.` : ''} />
    </>
  );
}
