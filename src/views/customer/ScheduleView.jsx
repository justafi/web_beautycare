'use client';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, EmptyState, ErrorState, PageHeader, Spinner, StatusBadge, cx } from '../../components/ui.jsx';
import { DAY_NAMES, formatDate, monthLabel, todayWIB } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

export default function ScheduleView() {
  const today = todayWIB();
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(today);
  const { data, loading, error, reload } = useFetch('/reservations/mine', { scope: 'active' });
  const list = data?.reservations || [];
  const byDate = useMemo(() => list.reduce((a, r) => ({ ...a, [r.date]: [...(a[r.date] || []), r] }), {}), [list]);

  const first = new Date(Date.UTC(ym.y, ym.m, 1));
  const lead = first.getUTCDay();
  const days = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const key = (d) => `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const move = (n) => setYm(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const dayList = byDate[selected] || [];

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <PageHeader title="Jadwal reservasi" subtitle="Kalender reservasi aktif Anda. Tanda titik menunjukkan hari yang ada jadwalnya." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => move(-1)} aria-label="Bulan sebelumnya" className="rounded-full p-2 hover:bg-blush-50"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-2xl">{monthLabel(ym.y, ym.m)}</h2>
            <button onClick={() => move(1)} aria-label="Bulan berikutnya" className="rounded-full p-2 hover:bg-blush-50"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-mist">{DAY_NAMES.map((d) => <div key={d} className="py-2">{d.slice(0, 3)}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => d === null ? <div key={`e${i}`} /> : (
              <button key={d} onClick={() => setSelected(key(d))} aria-label={formatDate(key(d))} aria-pressed={selected === key(d)}
                className={cx('relative aspect-square rounded-xl text-sm', selected === key(d) ? 'bg-rose-600 text-white' : key(d) === today ? 'bg-blush-100' : 'hover:bg-blush-50')}>
                {d}
                {byDate[key(d)] && <span className={cx('absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full', selected === key(d) ? 'bg-white' : 'bg-rose-600')} />}
              </button>
            ))}
          </div>
        </Card>
        <div>
          <h2 className="mb-3 text-2xl">{formatDate(selected)}</h2>
          {dayList.length === 0 ? <EmptyState icon={CalendarDays} title="Tidak ada jadwal" text="Pilih tanggal bertanda titik untuk melihat reservasi." /> : (
            <div className="space-y-3">
              {dayList.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between"><p className="font-display text-xl">{r.start_time} – {r.end_time}</p><StatusBadge status={r.status} /></div>
                  <p className="mt-1 text-sm">{r.service_name}</p>
                  <p className="text-xs text-mist">{r.staff_name} · {r.code}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <h2 className="mb-3 mt-10 text-2xl">Semua jadwal mendatang</h2>
      {list.length === 0 ? <p className="text-sm text-mist">Belum ada reservasi aktif.</p> : (
        <Card className="divide-y divide-blush-100 p-0">
          {list.map((r) => (
            <button key={r.id} onClick={() => { setSelected(r.date); setYm({ y: Number(r.date.slice(0, 4)), m: Number(r.date.slice(5, 7)) - 1 }); }} className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3 text-left text-sm hover:bg-blush-50">
              <span><span className="font-medium">{formatDate(r.date)}</span>, {r.start_time} · {r.service_name}</span>
              <StatusBadge status={r.status} />
            </button>
          ))}
        </Card>
      )}
    </>
  );
}
