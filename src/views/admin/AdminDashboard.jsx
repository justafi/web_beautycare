'use client';
import { CalendarCheck, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, EmptyState, ErrorState, PageHeader, PaymentBadge, Spinner, StatCard, StatusBadge, cx } from '../../components/ui.jsx';
import { formatDate, rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

export default function AdminDashboard() {
  const [period, setPeriod] = useState('daily');
  const { data, loading, error, reload } = useFetch('/admin/dashboard', { period });
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { stats, chart, popular, schedule, today } = data;
  const max = Math.max(1, ...popular.map((p) => p.total));
  return (
    <>
      <PageHeader title="Dashboard" subtitle={formatDate(today)} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Reservasi hari ini" value={stats.today_total} />
        <StatCard icon={Clock} label="Menunggu konfirmasi" value={stats.pending} />
        <StatCard icon={CheckCircle2} label="Reservasi selesai" value={stats.completed} />
        <StatCard icon={Wallet} label="Pendapatan (lunas)" value={rupiah(stats.revenue)} hint={`${stats.paid_count} transaksi dibayar`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl">Reservasi</h2>
            <div className="flex gap-1 rounded-full bg-blush-50 p-1" role="group" aria-label="Periode grafik">
              {[['daily', '14 hari'], ['monthly', '6 bulan']].map(([k, l]) => (
                <button key={k} onClick={() => setPeriod(k)} aria-pressed={period === k} className={cx('rounded-full px-3 py-1 text-sm', period === k ? 'bg-white shadow-soft' : 'text-mist')}>{l}</button>
              ))}
            </div>
          </div>
          <div className="h-64" aria-label="Grafik jumlah reservasi">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3CDD4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6F6568' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6F6568' }} width={28} />
                <Tooltip formatter={(v) => [v, 'Reservasi']} />
                <Bar dataKey="total" fill="#C98593" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-2xl">Layanan terpopuler</h2>
          {popular.length === 0 ? <p className="text-sm text-mist">Belum ada data.</p> : (
            <ul className="space-y-4">
              {popular.map((p) => (
                <li key={p.name}>
                  <div className="flex justify-between text-sm"><span>{p.name}</span><span className="text-mist">{p.total}×</span></div>
                  <div className="mt-1 h-2 rounded-full bg-blush-50"><div className="h-2 rounded-full bg-rose" style={{ width: `${(p.total / max) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-2xl">Jadwal pelayanan hari ini</h2>
      {schedule.length === 0 ? <EmptyState icon={CalendarCheck} title="Tidak ada jadwal hari ini" /> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-blush-50 text-mist"><tr><th className="px-4 py-3">Jam</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Terapis</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Bayar</th></tr></thead>
            <tbody className="divide-y divide-blush-100">
              {schedule.map((r) => (
                <tr key={r.id}><td className="px-4 py-3">{r.start_time}–{r.end_time}</td><td className="px-4 py-3">{r.customer_name}</td><td className="px-4 py-3">{r.service_name}</td><td className="px-4 py-3">{r.staff_name}</td><td className="px-4 py-3"><StatusBadge status={r.status} /></td><td className="px-4 py-3"><PaymentBadge status={r.payment_status} /></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
