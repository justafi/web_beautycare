'use client';
import { CalendarClock, CheckCheck, ClipboardList, Eye, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, parseError } from '../../api/client.js';
import RescheduleModal from '../../components/RescheduleModal.jsx';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Pagination, PaymentBadge, Select, Spinner, StatusBadge } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { METHODS, formatDate, rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

const PAGE_SIZE = 15;
const EMPTY = { q: '', from: '', to: '', service_id: '', staff_id: '', status: '', payment_status: '' };

export default function AdminReservations() {
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setQ(f.q); setPage(1); }, 300); return () => clearTimeout(t); }, [f.q]);
  const services = useFetch('/admin/services');
  const staff = useFetch('/admin/staff');
  const params = { q: q || undefined, from: f.from || undefined, to: f.to || undefined, service_id: f.service_id || undefined, staff_id: f.staff_id || undefined, status: f.status || undefined, payment_status: f.payment_status || undefined, page, page_size: PAGE_SIZE };
  const { data, loading, error, reload } = useFetch('/reservations', params);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null); // { r, to }
  const [resTarget, setResTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const setFilter = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const openDetail = async (id) => { try { setDetail((await api.get(`/reservations/${id}`)).data); } catch (e) { toast.error(parseError(e).message); } };
  const doStatus = async () => {
    setBusy(true);
    try {
      if (confirm.to === 'cancelled') await api.post(`/reservations/${confirm.r.id}/cancel`, { note: 'Dibatalkan oleh admin' });
      else await api.patch(`/reservations/${confirm.r.id}/status`, { status: confirm.to });
      toast.success(confirm.to === 'cancelled' ? 'Reservasi dibatalkan.' : 'Reservasi dikonfirmasi.');
      setConfirm(null); setDetail(null); reload();
    } catch (e) { toast.error(parseError(e).message); setConfirm(null); } finally { setBusy(false); }
  };
  const list = data?.reservations || [];
  const actions = (r) => (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" aria-label={`Detail ${r.code}`} onClick={() => openDetail(r.id)}><Eye className="h-4 w-4" /></Button>
      {r.status === 'pending' && <Button variant="ghost" size="sm" aria-label={`Konfirmasi ${r.code}`} onClick={() => setConfirm({ r, to: 'confirmed' })}><CheckCheck className="h-4 w-4" /></Button>}
      {['pending', 'confirmed'].includes(r.status) && <Button variant="ghost" size="sm" aria-label={`Ubah jadwal ${r.code}`} onClick={() => setResTarget(r)}><CalendarClock className="h-4 w-4" /></Button>}
      {['pending', 'confirmed', 'in_progress'].includes(r.status) && <Button variant="ghost" size="sm" aria-label={`Batalkan ${r.code}`} onClick={() => setConfirm({ r, to: 'cancelled' })}><XCircle className="h-4 w-4" /></Button>}
    </div>
  );

  return (
    <>
      <PageHeader title="Manajemen reservasi" subtitle="Cari, filter, konfirmasi, batalkan, atau ubah jadwal. Perubahan jadwal dicek ulang agar tidak bentrok." />
      <Card className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative sm:col-span-2"><Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-mist" aria-hidden /><Input aria-label="Cari" className="pl-10" placeholder="Cari kode atau nama pelanggan…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <Field label="Dari"><Input type="date" value={f.from} onChange={setFilter('from')} /></Field>
        <Field label="Sampai"><Input type="date" value={f.to} min={f.from || undefined} onChange={setFilter('to')} /></Field>
        <Select aria-label="Layanan" value={f.service_id} onChange={setFilter('service_id')}><option value="">Semua layanan</option>{(services.data?.services || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        <Select aria-label="Staf" value={f.staff_id} onChange={setFilter('staff_id')}><option value="">Semua staf</option>{(staff.data?.staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
        <Select aria-label="Status" value={f.status} onChange={setFilter('status')}>
          <option value="">Semua status</option><option value="pending">Menunggu konfirmasi</option><option value="confirmed">Dikonfirmasi</option><option value="in_progress">Sedang berlangsung</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option>
        </Select>
        <div className="flex gap-2"><Select aria-label="Pembayaran" value={f.payment_status} onChange={setFilter('payment_status')}><option value="">Semua pembayaran</option><option value="unpaid">Belum dibayar</option><option value="paid">Lunas</option><option value="refunded">Dikembalikan</option></Select><Button variant="ghost" onClick={() => { setF(EMPTY); setPage(1); }}>Reset</Button></div>
      </Card>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Reservasi tidak ditemukan" text="Ubah kata kunci atau filter." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="bg-blush-50 text-mist"><tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Jadwal</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Terapis</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Bayar</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-blush-100">
                {list.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium">{r.code}</td>
                    <td className="px-4 py-3">{formatDate(r.date, false)}<br /><span className="text-mist">{r.start_time}–{r.end_time}</span></td>
                    <td className="px-4 py-3">{r.customer_name}</td><td className="px-4 py-3">{r.service_name}</td><td className="px-4 py-3">{r.staff_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td><td className="px-4 py-3"><PaymentBadge status={r.payment_status} /></td>
                    <td className="px-4 py-3">{actions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} wide title="Detail reservasi">
        {detail && (() => {
          const r = detail.reservation;
          return (
            <div className="space-y-5 text-sm">
              <dl className="grid gap-3 sm:grid-cols-3">
                <D k="Kode" v={r.code} /><D k="Status" v={<StatusBadge status={r.status} />} /><D k="Pembayaran" v={<PaymentBadge status={r.payment_status} />} />
                <D k="Pelanggan" v={`${r.customer_name} (${r.customer_phone})`} /><D k="Email" v={r.customer_email} /><D k="Terapis" v={r.staff_name} />
                <D k="Layanan" v={r.service_name} /><D k="Tanggal" v={formatDate(r.date)} /><D k="Jam" v={`${r.start_time} – ${r.end_time}`} />
                <D k="Harga (snapshot)" v={rupiah(r.price)} /><D k="Diskon" v={rupiah(r.payment_discount)} /><D k="Total" v={rupiah(r.payment_total)} />
                <D k="Metode" v={METHODS[r.payment_method] || '-'} />
              </dl>
              <div><p className="text-mist">Catatan</p><p className="rounded-xl bg-blush-50 p-3">{r.notes || 'Tidak ada catatan.'}</p></div>
              <div>
                <p className="mb-1 text-mist">Riwayat status</p>
                <ul className="space-y-1">
                  {detail.history.map((h, i) => <li key={i} className="flex flex-wrap justify-between gap-2 rounded-lg bg-blush-50/60 px-3 py-1.5"><span>{h.from_status ? `${h.from_status} → ` : ''}<b>{h.to_status}</b>{h.note ? ` · ${h.note}` : ''}</span><span className="text-mist">{h.changed_by_name || 'Sistem'} · {h.created_at}</span></li>)}
                </ul>
              </div>
              <div className="flex flex-wrap justify-end gap-2">{r.status === 'pending' && <Button onClick={() => setConfirm({ r, to: 'confirmed' })}>Konfirmasi</Button>}{['pending', 'confirmed'].includes(r.status) && <Button variant="outline" onClick={() => { setResTarget(r); setDetail(null); }}>Ubah jadwal</Button>}</div>
            </div>
          );
        })()}
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} loading={busy} onConfirm={doStatus} danger={confirm?.to === 'cancelled'}
        confirmText={confirm?.to === 'cancelled' ? 'Ya, batalkan' : 'Ya, konfirmasi'} title={confirm?.to === 'cancelled' ? 'Batalkan reservasi?' : 'Konfirmasi reservasi?'}
        message={confirm ? `${confirm.r.code} · ${confirm.r.customer_name} · ${confirm.r.service_name}, ${formatDate(confirm.r.date, false)} ${confirm.r.start_time}.` : ''} />
      <RescheduleModal reservation={resTarget} canChangeStaff onClose={() => setResTarget(null)} onDone={() => { setResTarget(null); reload(); }} />
    </>
  );
}
const D = ({ k, v }) => <div><dt className="text-mist">{k}</dt><dd className="font-medium">{v}</dd></div>;
