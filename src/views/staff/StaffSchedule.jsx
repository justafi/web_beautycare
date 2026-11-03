'use client';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { api, parseError } from '../../api/client.js';
import { Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Spinner, StatCard, StatusBadge } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { addDays, formatDate, formatShort, todayWIB } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

const NEXT = {
  pending: { to: 'confirmed', label: 'Konfirmasi' },
  confirmed: { to: 'in_progress', label: 'Mulai layanan' },
  in_progress: { to: 'completed', label: 'Selesaikan' },
};

export default function StaffSchedule() {
  const toast = useToast();
  const [date, setDate] = useState(todayWIB());
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const summary = useFetch('/staff-me/summary');
  const { data, loading, error, reload } = useFetch('/staff-me/reservations', { from: date, to: date, status: status || undefined });
  const list = data?.reservations || [];

  const openDetail = async (id) => {
    try { setDetail((await api.get(`/reservations/${id}`)).data); } catch (e) { toast.error(parseError(e).message); }
  };
  const advance = async (r) => {
    setBusyId(r.id);
    try {
      await api.patch(`/reservations/${r.id}/status`, { status: NEXT[r.status].to });
      toast.success('Status diperbarui.');
      reload(); summary.reload(); setDetail(null);
    } catch (e) { toast.error(parseError(e).message); } finally { setBusyId(null); }
  };

  const s = summary.data;
  return (
    <>
      <PageHeader title="Jadwal pelayanan" subtitle={formatDate(date)} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Pelayanan hari ini" value={s ? s.today.total : '–'} hint={s ? `${s.today.done} selesai` : ''} />
        <StatCard icon={CalendarDays} label="Pelayanan minggu ini" value={s ? s.week.total : '–'} hint={s ? `${s.week.done} selesai · ${formatShort(s.week_range.start)}–${formatShort(s.week_range.end)}` : ''} />
      </div>
      <Card className="mb-5 grid items-end gap-4 sm:grid-cols-[auto_1fr_1fr]">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" aria-label="Hari sebelumnya" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setDate(todayWIB())}>Hari ini</Button>
          <Button variant="outline" size="sm" aria-label="Hari berikutnya" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Field label="Tanggal"><Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option><option value="pending">Menunggu konfirmasi</option><option value="confirmed">Dikonfirmasi</option>
            <option value="in_progress">Sedang berlangsung</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option>
          </Select>
        </Field>
      </Card>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Tidak ada jadwal" text="Belum ada pelayanan pada tanggal dan status yang dipilih." />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <button onClick={() => openDetail(r.id)} className="min-w-0 flex-1 text-left">
                <p className="font-display text-2xl">{r.start_time} – {r.end_time}</p>
                <p className="text-sm">{r.customer_name} · {r.service_name}</p>
                {r.notes && <p className="mt-1 truncate text-xs text-mist">Catatan: {r.notes}</p>}
              </button>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                {NEXT[r.status] && <Button size="sm" loading={busyId === r.id} onClick={() => advance(r)}>{NEXT[r.status].label}</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail reservasi">
        {detail && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              <Item k="Kode" v={detail.reservation.code} /><Item k="Status" v={<StatusBadge status={detail.reservation.status} />} />
              <Item k="Pelanggan" v={detail.reservation.customer_name} /><Item k="Telepon" v={detail.reservation.customer_phone} />
              <Item k="Layanan" v={detail.reservation.service_name} /><Item k="Durasi" v={`${detail.reservation.duration_min} menit`} />
              <Item k="Tanggal" v={formatDate(detail.reservation.date)} /><Item k="Jam" v={`${detail.reservation.start_time} – ${detail.reservation.end_time}`} />
            </dl>
            <div><p className="text-mist">Catatan pelanggan</p><p className="rounded-xl bg-blush-50 p-3">{detail.reservation.notes || 'Tidak ada catatan.'}</p></div>
            {NEXT[detail.reservation.status] && <Button loading={busyId === detail.reservation.id} onClick={() => advance(detail.reservation)}>{NEXT[detail.reservation.status].label}</Button>}
          </div>
        )}
      </Modal>
    </>
  );
}
const Item = ({ k, v }) => <div><dt className="text-mist">{k}</dt><dd className="font-medium">{v}</dd></div>;
