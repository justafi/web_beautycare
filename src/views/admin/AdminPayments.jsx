'use client';
import { Download, Receipt, Wallet } from 'lucide-react';
import { useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Pagination, PaymentBadge, Select, Spinner, StatCard } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { METHODS, formatDate, rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';
import { Clock, RotateCcw } from 'lucide-react';

const PAGE_SIZE = 15;

export default function AdminPayments() {
  const toast = useToast();
  const [f, setF] = useState({ from: '', to: '', status: '', method: '' });
  const [page, setPage] = useState(1);
  const params = { from: f.from || undefined, to: f.to || undefined, status: f.status || undefined, method: f.method || undefined };
  const { data, loading, error, reload } = useFetch('/admin/payments', { ...params, page, page_size: PAGE_SIZE });
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const setFilter = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const open = (p) => { setErrors({}); setEdit({ id: p.id, code: p.code, amount: p.amount, discount: p.discount, method: p.method || 'cash', status: p.status === 'unpaid' ? 'paid' : p.status, note: p.note || '' }); };
  const save = async (e) => {
    e.preventDefault();
    if (Number(edit.discount) < 0 || Number(edit.discount) > edit.amount) return setErrors({ discount: 'Diskon harus antara 0 dan harga layanan' });
    setSaving(true);
    try {
      await api.patch(`/admin/payments/${edit.id}`, { discount: Number(edit.discount), method: edit.method, status: edit.status, note: edit.note || null });
      toast.success('Pembayaran dicatat.'); setEdit(null); reload();
    } catch (ex) { const p = parseError(ex); setErrors(p.fields); toast.error(p.message); } finally { setSaving(false); }
  };
  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await api.get('/admin/payments/export.csv', { params, responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = 'transaksi.csv'; a.click(); URL.revokeObjectURL(url);
      toast.success('Laporan CSV diunduh.');
    } catch (ex) { toast.error(parseError(ex).message); } finally { setExporting(false); }
  };

  const list = data?.payments || [];
  const sum = data?.summary;
  return (
    <>
      <PageHeader title="Rekap transaksi" subtitle="Pembayaran dicatat manual oleh admin (belum ada payment gateway). Pendapatan aktual hanya dari status Lunas."
        actions={<Button variant="outline" loading={exporting} onClick={exportCsv}><Download className="h-4 w-4" />Ekspor CSV</Button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Pendapatan aktual" value={sum ? rupiah(sum.revenue) : '–'} hint="Hanya pembayaran lunas" />
        <StatCard icon={Receipt} label="Transaksi lunas" value={sum ? sum.paid_count : '–'} />
        <StatCard icon={Clock} label="Belum dibayar" value={sum ? rupiah(sum.pending_amount) : '–'} hint="Reservasi aktif/selesai, belum lunas" />
        <StatCard icon={RotateCcw} label="Dikembalikan" value={sum ? rupiah(sum.refunded) : '–'} />
      </div>
      <Card className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Dari tanggal"><Input type="date" value={f.from} onChange={setFilter('from')} /></Field>
        <Field label="Sampai tanggal"><Input type="date" value={f.to} min={f.from || undefined} onChange={setFilter('to')} /></Field>
        <Field label="Status"><Select value={f.status} onChange={setFilter('status')}><option value="">Semua</option><option value="unpaid">Belum dibayar</option><option value="paid">Lunas</option><option value="refunded">Dikembalikan</option></Select></Field>
        <Field label="Metode"><Select value={f.method} onChange={setFilter('method')}><option value="">Semua</option>{Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
      </Card>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={Receipt} title="Belum ada transaksi" text="Ubah periode atau filter." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-blush-50 text-mist"><tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3 text-right">Harga</th><th className="px-4 py-3 text-right">Diskon</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-blush-100">
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.code}</td><td className="px-4 py-3">{formatDate(p.date, false)}</td><td className="px-4 py-3">{p.customer_name}</td><td className="px-4 py-3">{p.service_name}</td>
                    <td className="px-4 py-3 text-right">{rupiah(p.amount)}</td><td className="px-4 py-3 text-right">{rupiah(p.discount)}</td><td className="px-4 py-3 text-right font-medium">{rupiah(p.total)}</td>
                    <td className="px-4 py-3">{METHODS[p.method] || '-'}</td><td className="px-4 py-3"><PaymentBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant={p.status === 'unpaid' ? 'primary' : 'ghost'} onClick={() => open(p)}>{p.status === 'unpaid' ? 'Catat bayar' : 'Ubah'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Catat pembayaran">
        {edit && (
          <form onSubmit={save} className="space-y-4" noValidate>
            <p className="text-sm text-mist">{edit.code} · Harga {rupiah(edit.amount)}</p>
            <Field label="Diskon (Rp)" error={errors.discount}><Input type="number" min={0} max={edit.amount} step={1000} value={edit.discount} onChange={(e) => setEdit({ ...edit, discount: e.target.value })} /></Field>
            <p className="text-sm">Total dibayar: <b>{rupiah(edit.amount - Number(edit.discount || 0))}</b></p>
            <Field label="Metode" error={errors.method}><Select value={edit.method} onChange={(e) => setEdit({ ...edit, method: e.target.value })}>{Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="Status"><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}><option value="paid">Lunas</option><option value="unpaid">Belum dibayar</option><option value="refunded">Dikembalikan</option></Select></Field>
            <Field label="Catatan"><Input maxLength={255} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Batal</Button><Button type="submit" loading={saving}>Simpan</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
