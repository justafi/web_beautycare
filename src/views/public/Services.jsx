'use client';
import { Clock, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, EmptyState, ErrorState, Input, SmartImage, Spinner, cx } from '../../components/ui.jsx';
import { rupiah } from '../../lib/format.js';
import { useFetch } from '../../lib/useFetch.js';

export default function Services() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(search), 300); return () => clearTimeout(t); }, [search]);
  const cats = useFetch('/services/categories');
  const { data, loading, error, reload } = useFetch('/services', { search: q || undefined, category: category || undefined });
  const list = data?.services || [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-5xl">Layanan</h1>
      <p className="mt-2 text-mist">Pilih perawatan yang Anda butuhkan, lalu lanjut ke reservasi.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-mist" aria-hidden />
          <Input aria-label="Cari layanan" className="pl-10" placeholder="Cari layanan…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
          {['', ...(cats.data?.categories || [])].map((c) => (
            <button key={c || 'all'} onClick={() => setCategory(c)} aria-pressed={category === c}
              className={cx('rounded-full border px-4 py-1.5 text-sm', category === c ? 'border-rose-600 bg-rose-600 text-white' : 'border-blush-200 bg-white hover:bg-blush-50')}>{c || 'Semua'}</button>
          ))}
        </div>
      </div>
      <div className="mt-8">
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
          <EmptyState icon={Sparkles} title="Layanan tidak ditemukan" text="Coba kata kunci lain atau pilih kategori Semua." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <Card key={s.id} className="flex flex-col overflow-hidden p-0">
                <SmartImage src={s.photo_url} alt={s.name} className="h-44 w-full" />
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs text-rose-700">{s.category}</span>
                  <h2 className="text-2xl">{s.name}</h2>
                  <p className="mt-1 flex-1 text-sm text-mist">{s.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="font-display text-2xl text-rose-700">{rupiah(s.price)}</p>
                      <p className="flex items-center gap-1 text-xs text-mist"><Clock className="h-3 w-3" aria-hidden />{s.duration_min} menit</p>
                    </div>
                    <Link href={`/pelanggan?layanan=${s.id}`}><Button size="sm">Pilih Layanan</Button></Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
