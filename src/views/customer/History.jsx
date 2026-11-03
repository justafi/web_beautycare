'use client';
import { History as HistoryIcon } from 'lucide-react';
import { useState } from 'react';
import { Card, EmptyState, ErrorState, Field, Input, PageHeader, PaymentBadge, Select, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

export default function History() {
  const [f, setF] = useState({ from: '', to: '', status: '' });
  const { data, loading, error, reload } = useFetch('/reservations/mine', { scope: 'history', from: f.from || undefined, to: f.to || undefined, status: f.status || undefined });
  const list = data?.reservations || [];
  return (
    <>
      <PageHeader title="Riwayat reservasi" subtitle="Reservasi yang sudah selesai atau dibatalkan." />
      <Card className="mb-5 grid gap-4 sm:grid-cols-3">
        <Field label="Dari tanggal"><Input type="date" value={f.from} max={f.to || undefined} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="Sampai tanggal"><Input type="date" value={f.to} min={f.from || undefined} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="">Semua</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option>
          </Select>
        </Field>
      </Card>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="Belum ada riwayat" text="Reservasi yang selesai atau dibatalkan akan muncul di sini." />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs text-mist">{r.code}</p>
                <p className="font-display text-xl">{r.service_name}</p>
                <p className="text-sm text-mist">{formatDate(r.date)}, {r.start_time} · {r.staff_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={r.status} />
                <p className="text-sm">{rupiah(r.price)}</p>
                {r.status === 'completed' && <PaymentBadge status={r.payment_status} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
