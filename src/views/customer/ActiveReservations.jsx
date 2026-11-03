'use client';
import { CalendarClock, CalendarX2, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { api, parseError } from '../../api/client.js';
import RescheduleModal from '../../components/RescheduleModal.jsx';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, PageHeader, PaymentBadge, Spinner, StatusBadge, cx } from '../../components/ui.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

const STEPS = [['pending', 'Menunggu'], ['confirmed', 'Dikonfirmasi'], ['in_progress', 'Berlangsung'], ['completed', 'Selesai']];

export function StatusTracker({ status }) {
  if (status === 'cancelled') return <p className="text-sm text-mist">Reservasi dibatalkan.</p>;
  const idx = STEPS.findIndex(([k]) => k === status);
  return (
    <ol className="flex items-center gap-1" aria-label="Status layanan">
      {STEPS.map(([k, label], i) => (
        <li key={k} className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className={cx('h-1.5 w-full rounded-full', i <= idx ? 'bg-rose-600' : 'bg-blush-100')} />
          <span className={cx('text-[11px]', i === idx ? 'font-semibold text-rose-700' : 'text-mist')}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function ActiveReservations() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch('/reservations/mine', { scope: 'active' });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [resTarget, setResTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    try {
      await api.post(`/reservations/${cancelTarget.id}/cancel`, {});
      toast.success('Reservasi dibatalkan.');
      setCancelTarget(null); reload();
    } catch (e) { toast.error(parseError(e).message); setCancelTarget(null); } finally { setBusy(false); }
  };

  const list = data?.reservations || [];
  return (
    <>
      <PageHeader title="Reservasi aktif" subtitle="Reservasi yang belum selesai beserta status layanannya." />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada reservasi aktif" text="Buat reservasi pertama Anda dan pantau statusnya di sini." action={<Link href="/pelanggan"><Button>Buat reservasi</Button></Link>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs text-mist">{r.code}</p><h2 className="text-2xl">{r.service_name}</h2></div>
                <StatusBadge status={r.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-mist">Tanggal</dt><dd>{formatDate(r.date)}</dd></div>
                <div><dt className="text-mist">Waktu</dt><dd>{r.start_time} – {r.end_time}</dd></div>
                <div><dt className="text-mist">Terapis</dt><dd>{r.staff_name}</dd></div>
                <div><dt className="text-mist">Harga</dt><dd>{rupiah(r.price)} <PaymentBadge status={r.payment_status} /></dd></div>
              </dl>
              {r.notes && <p className="mt-3 rounded-xl bg-blush-50 p-3 text-sm text-mist">Catatan: {r.notes}</p>}
              <div className="mt-4"><StatusTracker status={r.status} /></div>
              {['pending', 'confirmed'].includes(r.status) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setResTarget(r)}><CalendarClock className="h-4 w-4" />Ubah jadwal</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCancelTarget(r)}><CalendarX2 className="h-4 w-4" />Batalkan</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} loading={busy} danger onConfirm={cancel} confirmText="Ya, batalkan" title="Batalkan reservasi?"
        message={cancelTarget ? `${cancelTarget.service_name} pada ${formatDate(cancelTarget.date)} pukul ${cancelTarget.start_time}. Pembatalan hanya dapat dilakukan sebelum batas waktu yang ditetapkan salon.` : ''} />
      <RescheduleModal reservation={resTarget} onClose={() => setResTarget(null)} onDone={() => { setResTarget(null); reload(); }} />
    </>
  );
}
